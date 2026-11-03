import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { buildPublicationMessage, notifyPublication, saveAndNotify } from "../src/integrations/pushNotifications.js";

describe("publication notifications", () => {
  it("saves before attempting the notification", async () => {
    const calls = [];
    const result = await saveAndNotify("event", async () => { calls.push("saved"); return { id: "1", name: "Grading" }; }, async () => { calls.push("notified"); return { status: "accepted" }; });
    assert.deepEqual(calls, ["saved", "notified"]);
    assert.equal(result.item.id, "1");
  });
  it("never notifies when the database save fails", async () => {
    let notified = false;
    await assert.rejects(saveAndNotify("news", async () => { throw new Error("Database failed"); }, async () => { notified = true; }));
    assert.equal(notified, false);
  });
  it("keeps the saved publication successful when sending fails", async () => {
    const result = await saveAndNotify("news", async () => ({ id: "saved" }), async () => { throw new Error("Push failed"); });
    assert.equal(result.item.id, "saved");
    assert.equal(result.notification.status, "failed");
  });
  it("supports event and news contracts, multilingual headings, and no private data", () => {
    for (const kind of ["event", "news"]) {
      const payload = buildPublicationMessage(kind, { id: "1", title: "Public title", date: "2026-12-12", email: "private@example.com" });
      assert.equal(payload.topic, "wrja-public-updates");
      assert.ok(payload.data.title_af && payload.data.title_zu);
      assert.equal(payload.notification, undefined);
      assert.ok(!JSON.stringify(payload).includes("private@example.com"));
    }
  });
  it("does not call Google while disabled", async () => {
    const result = await notifyPublication("news", { id: "1", title: "News" }, { env: {}, fetchImpl: () => { throw new Error("Unexpected network"); } });
    assert.equal(result.status, "disabled");
  });
  it("uses OAuth and FCM with a generated test key, not a real service account", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
    const env = { FCM_NOTIFICATIONS_ENABLED: "true", FIREBASE_PROJECT_ID: "wrja-test-project", FIREBASE_CLIENT_EMAIL: "test@wrja-test-project.iam.gserviceaccount.com", FIREBASE_PRIVATE_KEY: privateKey };
    const calls = [];
    const result = await notifyPublication("news", { id: "1", title: "News" }, { env, fetchImpl: async (url, request) => {
      calls.push(url);
      if (url.includes("oauth2")) return { ok: true, json: async () => ({ access_token: "mock-token", expires_in: 3600 }) };
      assert.equal(request.headers.Authorization, "Bearer mock-token");
      assert.equal(JSON.parse(request.body).message.topic, "wrja-public-updates");
      return { ok: true, json: async () => ({ name: "projects/test/messages/test" }) };
    } });
    assert.equal(result.status, "accepted");
    assert.equal(calls.length, 2);
  });
  it("does not fail or expose secrets on invalid credentials", async () => {
    const logs = [];
    const result = await notifyPublication("news", { id: "1", title: "News" }, { env: { FCM_NOTIFICATIONS_ENABLED: "true", FIREBASE_PRIVATE_KEY: "secret-sentinel" }, logger: { warn: (...args) => logs.push(args) } });
    assert.equal(result.status, "failed");
    assert.ok(!JSON.stringify(logs).includes("secret-sentinel"));
  });
});
