import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deleteGalleryItem, isLegacyGalleryPath, isManagedGalleryUploadPath } from "../galleryRepo.js";
import { loadProfile, requireAdmin } from "../auth.js";

const GALLERY_ID = "2cdb5c22-f185-4f2b-9b6f-f7eaa59874b3";
const GALLERY_PATH = "gallery/Adult 2.jpg";
const ADMIN_UPLOAD_PATH = "admin/2026/4ef1c1ca-516b-4c57-a56c-304e8915f71a.webp";

function fakeClients({ downloadError = null, removeError = null, rpcResult = { data: true, error: null } } = {}) {
  const calls = [];
  const bucket = {
    async download(path) {
      calls.push(["download", path]);
      if (downloadError) return { data: null, error: downloadError };
      return { data: new Blob(["image-data"], { type: "image/jpeg" }), error: null };
    },
    async remove(paths) {
      calls.push(["remove", paths[0]]);
      return { error: removeError };
    },
    async upload(path, _buffer, options) {
      calls.push(["restore", path, options.upsert]);
      return { error: null };
    },
  };

  const storageClient = {
    storage: {
      from(name) {
        assert.equal(name, "public-media");
        return bucket;
      },
    },
    from() {
      return {
        select() {
          return {
            order() {
              return { order: async () => ({ data: [], error: null }) };
            },
          };
        },
        update() {
          return { eq: async () => ({ error: null }) };
        },
      };
    },
  };
  const databaseClient = {
    async rpc(name, args) {
      calls.push(["rpc", name, args]);
      return rpcResult;
    },
  };
  return { calls, storageClient, databaseClient };
}

function deleteItem(id, imagePath, clients) {
  return deleteGalleryItem(id, { imagePath }, {
    accessToken: "authenticated-admin-token",
    storageClient: clients.storageClient,
    databaseClient: clients.databaseClient,
  });
}

describe("gallery deletion validation", () => {
  it("accepts only gallery paths and correctly formed managed upload paths", () => {
    assert.equal(isLegacyGalleryPath(GALLERY_PATH), true);
    assert.equal(isLegacyGalleryPath("gallery/../private/proof.pdf"), false);
    assert.equal(isLegacyGalleryPath("/gallery/Adult 2.jpg"), false);
    assert.equal(isManagedGalleryUploadPath(ADMIN_UPLOAD_PATH), true);
    assert.equal(isManagedGalleryUploadPath("admin/2026/not-a-uuid.jpg"), false);
  });

  it("rejects invalid IDs and paths before contacting Storage", async () => {
    const clients = fakeClients();
    await assert.rejects(deleteItem("not-a-uuid", GALLERY_PATH, clients), { status: 400 });
    await assert.rejects(deleteItem(GALLERY_ID, "gallery/../private/proof.pdf", clients), { status: 400 });
    assert.deepEqual(clients.calls, []);
  });
});

describe("permanent gallery deletion", () => {
  it("does not call the database deletion RPC when Storage has no object", async () => {
    const clients = fakeClients({ downloadError: { statusCode: 404, message: "Object not found" } });
    await assert.rejects(deleteItem(GALLERY_ID, GALLERY_PATH, clients), { status: 424 });
    assert.deepEqual(clients.calls, [["download", GALLERY_PATH]]);
  });

  it("removes the exact legacy and admin Storage objects before calling the authenticated RPC", async () => {
    const paths = [GALLERY_PATH, ADMIN_UPLOAD_PATH];
    for (const imagePath of paths) {
      const clients = fakeClients();
      const result = await deleteItem(GALLERY_ID, imagePath, clients);
      assert.equal(result.deleted, true);
      assert.deepEqual(clients.calls.slice(0, 3), [
        ["download", imagePath],
        ["remove", imagePath],
        ["rpc", "wrja_delete_gallery_item", { item_id: GALLERY_ID }],
      ]);
    }
  });

  it("does not call the database RPC when Storage deletion fails", async () => {
    const clients = fakeClients({ removeError: { message: "Storage unavailable" } });
    await assert.rejects(deleteItem(GALLERY_ID, GALLERY_PATH, clients), { status: 424 });
    assert.deepEqual(clients.calls.map(([operation]) => operation), ["download", "remove", "restore"]);
  });

  it("restores the Storage object when the database deletion fails", async () => {
    const clients = fakeClients({ rpcResult: { data: null, error: { code: "XX000", message: "Database failure" } } });
    await assert.rejects(deleteItem(GALLERY_ID, GALLERY_PATH, clients), { status: 424 });
    assert.deepEqual(clients.calls.map(([operation]) => operation), ["download", "remove", "rpc", "restore"]);
    assert.equal(clients.calls.at(-1)[1], GALLERY_PATH);
    assert.equal(clients.calls.at(-1)[2], true);
  });
});

describe("gallery deletion authorization", () => {
  it("allows an active administrator profile", async () => {
    const profileClient = {
      from() {
        return {
          select() { return this; },
          eq() { return this; },
          async maybeSingle() {
            return { data: { id: GALLERY_ID, is_active: true, profile_role: "administrator" }, error: null };
          },
        };
      },
    };
    const user = await loadProfile(profileClient, { id: GALLERY_ID });
    const errors = [];
    requireAdmin({ user }, {}, (error) => errors.push(error));
    assert.equal(user.role, "admin");
    assert.deepEqual(errors, [undefined]);
  });

  it("rejects unauthenticated and non-administrator callers", () => {
    const errors = [];
    requireAdmin({ user: null }, {}, (error) => errors.push(error));
    requireAdmin({ user: { role: "athlete" } }, {}, (error) => errors.push(error));
    assert.deepEqual(errors.map((error) => error.status), [401, 403]);
  });

  it("rejects inactive profiles", async () => {
    const profileClient = {
      from() {
        return {
          select() { return this; },
          eq() { return this; },
          async maybeSingle() {
            return { data: { id: GALLERY_ID, is_active: false, profile_role: "administrator" }, error: null };
          },
        };
      },
    };
    await assert.rejects(loadProfile(profileClient, { id: GALLERY_ID }), { status: 403 });
  });
});