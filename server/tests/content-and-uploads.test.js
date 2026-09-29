import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, HTML_AS_PNG, MEMBER, PDF_DATA_URL, PNG_DATA_URL, SVG_DATA_URL, browser, startServer } from "./helpers.js";

let server;
let admin;
before(async () => {
  server = await startServer();
  admin = browser(server.base);
  await admin.login(...ADMIN);
});
after(() => server.stop());

// Sends the path exactly as written (fetch would normalise "../" away before sending).
function rawGet(rawPath) {
  const { port } = new URL(server.base);
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path: rawPath, method: "GET" }, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body, type: res.headers["content-type"] || "" }));
    });
    req.on("error", reject);
    req.end();
  });
}

const publicFiles = () => fs.readdirSync(path.join(server.dataDir, "uploads", "public"));

describe("image uploads", () => {
  it("accepts a real image and serves it safely", async () => {
    const r = await admin.post("/api/admin/uploads", { dataUrl: PNG_DATA_URL });
    assert.equal(r.status, 201);
    assert.match(r.data.url, /^\/uploads\/public\/[0-9a-f-]{36}\.png$/);
    const file = await fetch(server.base + r.data.url);
    assert.equal(file.status, 200);
    assert.equal(file.headers.get("content-type"), "image/png");
    assert.equal(file.headers.get("x-content-type-options"), "nosniff");
  });

  it("rejects SVG, HTML disguised as PNG, PDFs and garbage", async () => {
    for (const dataUrl of [SVG_DATA_URL, HTML_AS_PNG, PDF_DATA_URL, "data:image/png;base64,AAAA", "not a data url", "", undefined]) {
      const r = await admin.post("/api/admin/uploads", { dataUrl });
      assert.equal(r.status, 400, `should reject ${String(dataUrl).slice(0, 30)}`);
    }
  });

  it("rejects oversized uploads", async () => {
    const big = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(5 * 1024 * 1024)]);
    const r = await admin.post("/api/admin/uploads", { dataUrl: `data:image/png;base64,${big.toString("base64")}` });
    assert.equal(r.status, 413);
  });

  it("cannot be used to read files outside the uploads folder", async () => {
    const probes = [
      "/uploads/public/../../.env.local", "/uploads/public/..%2f..%2f.env.local", "/uploads/public/%2e%2e/%2e%2e/server.js",
      "/uploads/public/..%5c..%5cwrja.db", "/uploads/public/....//....//server.js", "/uploads/private/anything.pdf",
      "/uploads/public/%00.jpg", "/api/../server.js",
    ];
    for (const probe of probes) {
      const r = await rawGet(probe);
      assert.ok(!r.body.includes("GEMINI") && !r.body.includes("SQLite format") && !r.body.includes("express"), `${probe} leaked file contents`);
      assert.ok(!/javascript|text\/plain/.test(r.type) || r.status >= 400, `${probe} served a script/text file`);
    }
  });
});

describe("competitions, events and news", () => {
  it("creates, edits and deletes a competition with an uploaded image", async () => {
    const { data: up } = await admin.post("/api/admin/uploads", { dataUrl: PNG_DATA_URL });
    const created = await admin.post("/api/admin/competitions", {
      name: "Spring Open & Kata", type: "Competition", date: "2026-11-01", location: "Krugersdorp",
      registrationUrl: "https://example.com/register", paymentRequired: true, paymentInstructions: "FNB 123",
      image: up.url, displayOrder: 3,
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.item.slug, "spring-open-and-kata");
    assert.equal(created.data.item.image, up.url);

    const again = await admin.post("/api/admin/competitions", { name: "Spring Open & Kata", type: "Competition" });
    assert.equal(again.data.item.slug, "spring-open-and-kata-2", "slugs stay unique");
    assert.equal(again.data.item.image, "/uploads/public/default-competition.jpg", "no image -> default");

    const edited = await admin.put("/api/admin/competitions/spring-open-and-kata", { ...created.data.item, name: "Spring Open", image: "" });
    assert.equal(edited.data.item.slug, "spring-open-and-kata", "slug is stable");
    assert.equal(edited.data.item.image, "/uploads/public/default-competition.jpg");
    assert.ok(!publicFiles().includes(path.basename(up.url)), "old uploaded image is cleaned up");

    // members see it in full, visitors see the teaser
    const m = browser(server.base);
    const anon = (await m.get("/api/competitions")).data.items.find((c) => c.slug === "spring-open-and-kata");
    assert.equal(anon.registrationUrl, undefined);
    assert.equal(anon.status, "Registration Open");

    assert.equal((await admin.del("/api/admin/competitions/spring-open-and-kata")).status, 200);
    assert.equal((await admin.del("/api/admin/competitions/spring-open-and-kata")).status, 404);
  });

  it("rejects dangerous links and non-uploaded images", async () => {
    const attempt = (extra) => admin.post("/api/admin/events", { name: "E", type: "T", date: "2026-12-01", location: "L", ...extra });
    assert.equal((await attempt({ applicationSheetUrl: "javascript:alert(1)" })).status, 400);
    assert.equal((await attempt({ applicationSheetUrl: "data:text/html,<script>1</script>" })).status, 400);
    assert.equal((await attempt({ image: "https://evil.example/track.gif" })).status, 400);
    assert.equal((await attempt({ image: "/uploads/public/../../server.js" })).status, 400);
    assert.equal((await attempt({ qrCodeImage: "/etc/passwd" })).status, 400);
    assert.equal((await attempt({ date: "next tuesday" })).status, 400);
    assert.equal((await attempt({ name: "" })).status, 400);
    assert.equal((await attempt({ name: "x".repeat(500) })).status, 400);
  });

  it("stores an event with an uploaded QR code image, visible to members only", async () => {
    const qr = (await admin.post("/api/admin/uploads", { dataUrl: PNG_DATA_URL })).data.url;
    const created = await admin.post("/api/admin/events", {
      name: "Club grading", type: "Grading", date: "2026-12-05", location: "Dojo",
      applicationSheetUrl: "https://docs.google.com/spreadsheets/d/abc", qrCodeImage: qr,
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.item.qrCodeImage, qr);
    assert.equal(created.data.item.image, "/uploads/public/default-event.jpg");

    const list = (await admin.get("/api/events")).data.items;
    assert.ok(list.some((e) => e.id === created.data.item.id && e.qrCodeImage === qr));
    assert.equal((await browser(server.base).get("/api/events")).status, 401);

    const removedQr = await admin.put(`/api/admin/events/${created.data.item.id}`, { ...created.data.item, qrCodeImage: "" });
    assert.equal(removedQr.data.item.qrCodeImage, "");
  });

  it("publishes news, keeps it newest-first, and formats the date", async () => {
    const created = await admin.post("/api/admin/news", {
      title: "Big result", sortDate: "2027-01-15", category: "Results", excerpt: "We won.", body: "Para one.\n\nPara two.",
    });
    assert.equal(created.status, 201);
    assert.match(created.data.item.date, /15 January 2027|15 Jan/);
    const list = (await browser(server.base).get("/api/news")).data.items;
    assert.equal(list[0].id, created.data.item.id);
    assert.equal(list[0].body, "Para one.\n\nPara two.");
    assert.equal((await admin.del(`/api/admin/news/${created.data.item.id}`)).status, 200);
  });

  it("returns 404 (not a crash) for bad ids", async () => {
    assert.equal((await admin.put("/api/admin/events/abc", {})).status, 404);
    assert.equal((await admin.put("/api/admin/news/99999", { title: "t", sortDate: "2026-01-01", category: "c", excerpt: "e" })).status, 404);
    assert.equal((await admin.del("/api/admin/competitions/nope")).status, 404);
  });
});

describe("contact messages", () => {
  it("saves a public message and lets the admin manage it", async () => {
    const visitor = browser(server.base);
    const sent = await visitor.post("/api/messages", { name: "Zoe", email: "zoe@x.co", phone: "078 000 0000", message: "Do you run kids classes?", source: "Event enquiry: NRE" });
    assert.equal(sent.status, 201);

    const list = (await admin.get("/api/admin/messages")).data.items;
    assert.equal(list.length, 1);
    assert.equal(list[0].status, "new");
    assert.equal((await admin.get("/api/admin/counts")).data.unreadMessages, 1);

    assert.equal((await admin.patch(`/api/admin/messages/${list[0].id}`, { status: "read" })).data.item.status, "read");
    assert.equal((await admin.get("/api/admin/counts")).data.unreadMessages, 0);
    assert.equal((await admin.patch(`/api/admin/messages/${list[0].id}`, { status: "hacked" })).status, 400);
    assert.equal((await admin.del(`/api/admin/messages/${list[0].id}`)).status, 200);
    assert.equal((await visitor.get("/api/admin/messages")).status, 401, "visitors can't read the inbox");
  });

  it("validates input and silently drops bot submissions (honeypot)", async () => {
    const v = browser(server.base);
    assert.equal((await v.post("/api/messages", { name: "", email: "a@b.co", message: "hello there" })).status, 400);
    assert.equal((await v.post("/api/messages", { name: "A", email: "bad", message: "hello there" })).status, 400);
    assert.equal((await v.post("/api/messages", { name: "A", email: "a@b.co", message: "hi" })).status, 400);
    assert.equal((await v.post("/api/messages", { name: "A", email: "a@b.co", message: "x".repeat(3001) })).status, 400);
    const before = (await admin.get("/api/admin/messages")).data.items.length;
    assert.equal((await v.post("/api/messages", { name: "Bot", email: "bot@x.co", message: "buy pills now", website: "http://spam" })).status, 201);
    assert.equal((await admin.get("/api/admin/messages")).data.items.length, before, "honeypot message not stored");
  });

  it("stores HTML as plain text (React escapes it on display) and rate-limits floods", async () => {
    const v = browser(server.base);
    const payload = "<img src=x onerror=alert(1)> hello";
    assert.equal((await v.post("/api/messages", { name: "<b>X</b>", email: "x@x.co", message: payload })).status, 201);
    const stored = (await admin.get("/api/admin/messages")).data.items.find((m) => m.message === payload);
    assert.ok(stored, "kept verbatim as data, never as markup");
    let limited = 0;
    for (let i = 0; i < 12; i += 1) {
      const r = await v.post("/api/messages", { name: "Flood", email: "f@x.co", message: "flooding the inbox" });
      if (r.status === 429) limited += 1;
    }
    assert.ok(limited > 0, "flooding is rate limited");
  });
});

describe("proof of payment", () => {
  let alice;
  let bob;
  before(async () => {
    await admin.post("/api/admin/users", { firstName: "Alice", lastName: "A", email: "alice@x.co", password: "Passw0rd!", role: "athlete" });
    await admin.post("/api/admin/users", { firstName: "Bob", lastName: "B", email: "bob@x.co", password: "Passw0rd!", role: "athlete" });
    alice = browser(server.base);
    bob = browser(server.base);
    await alice.login("alice@x.co", "Passw0rd!");
    await bob.login("bob@x.co", "Passw0rd!");
  });

  it("requires login and a genuine PDF/JPG/PNG", async () => {
    assert.equal((await browser(server.base).post("/api/payments", { dataUrl: PDF_DATA_URL })).status, 401);
    assert.equal((await alice.post("/api/payments", { dataUrl: SVG_DATA_URL, fileName: "x.svg" })).status, 400);
    assert.equal((await alice.post("/api/payments", { dataUrl: HTML_AS_PNG, fileName: "x.png" })).status, 400);
    assert.equal((await alice.post("/api/payments", { dataUrl: PDF_DATA_URL, competitionSlug: "does-not-exist" })).status, 400);
  });

  it("keeps the file private to its owner and admins", async () => {
    const up = await alice.post("/api/payments", { dataUrl: PDF_DATA_URL, fileName: "EFT confirmation.pdf", competitionSlug: "nre" });
    assert.equal(up.status, 201);
    assert.equal(up.data.item.competitionName, "NRE");
    assert.equal(up.data.item.storedName, undefined, "internal file name never sent to clients");
    const id = up.data.item.id;

    assert.equal((await alice.get(`/api/payments/${id}/file`)).response.status, 200);
    assert.equal((await admin.get(`/api/payments/${id}/file`)).response.status, 200);
    assert.equal((await bob.get(`/api/payments/${id}/file`)).status, 404, "another member cannot read it");
    assert.equal((await browser(server.base).get(`/api/payments/${id}/file`)).status, 401);

    assert.equal((await bob.get("/api/payments/mine")).data.items.length, 0);
    assert.equal((await alice.get("/api/payments/mine")).data.items.length, 1);
    assert.equal((await alice.patch(`/api/admin/payments/${id}`, { status: "Approved" })).status, 403, "members can't approve their own payment");

    const approved = await admin.patch(`/api/admin/payments/${id}`, { status: "Approved" });
    assert.equal(approved.data.item.status, "Approved");
    assert.equal((await alice.get("/api/payments/mine")).data.items[0].status, "Approved");

    const privateDir = path.join(server.dataDir, "uploads", "private");
    assert.equal(fs.readdirSync(privateDir).length, 1);
    assert.equal((await admin.del(`/api/admin/payments/${id}`)).status, 200);
    assert.equal(fs.readdirSync(privateDir).length, 0, "file removed with the record");
  });
});

describe("user management guards", () => {
  it("cannot demote yourself, the last admin, or delete admins/yourself", async () => {
    const users = (await admin.get("/api/admin/users")).data.items;
    const me = users.find((u) => u.email === ADMIN[0]);
    assert.equal((await admin.put(`/api/admin/users/${me.id}`, { ...me, role: "athlete" })).status, 400);
    assert.equal((await admin.del(`/api/admin/users/${me.id}`)).status, 400);

    const dup = await admin.post("/api/admin/users", { firstName: "D", lastName: "U", email: MEMBER[0].toUpperCase(), password: "Passw0rd!", role: "athlete" });
    assert.equal(dup.status, 409, "emails are unique regardless of case");
    assert.equal((await admin.post("/api/admin/users", { firstName: "W", lastName: "P", email: "wp@x.co", password: "weak", role: "athlete" })).status, 400);
    assert.equal((await admin.post("/api/admin/users", { firstName: "W", lastName: "P", email: "wp@x.co", password: "Passw0rd!", role: "superuser" })).status, 400);
  });

  it("stores passwords hashed and signs a user out when their password is reset", async () => {
    const created = (await admin.post("/api/admin/users", { firstName: "Pat", lastName: "P", email: "pat@x.co", password: "Passw0rd!", role: "athlete" })).data.item;
    const pat = browser(server.base);
    await pat.login("pat@x.co", "Passw0rd!");
    assert.equal((await pat.get("/api/auth/me")).data.user.email, "pat@x.co");

    await admin.put(`/api/admin/users/${created.id}`, { ...created, password: "NewPassw0rd!" });
    assert.equal((await pat.get("/api/auth/me")).data.user, null, "old session revoked after password reset");
    assert.equal((await browser(server.base).post("/api/auth/login", { email: "pat@x.co", password: "Passw0rd!" })).status, 401);
    await browser(server.base).login("pat@x.co", "NewPassw0rd!");

    // blank password on edit keeps the existing one
    await admin.put(`/api/admin/users/${created.id}`, { ...created, firstName: "Patricia", password: "" });
    await browser(server.base).login("pat@x.co", "NewPassw0rd!");

    // the raw database never contains a plaintext password
    const dbFiles = ["wrja.db", "wrja.db-wal"].filter((f) => fs.existsSync(path.join(server.dataDir, f)));
    const raw = dbFiles.map((f) => fs.readFileSync(path.join(server.dataDir, f)).toString("latin1")).join("");
    assert.ok(!raw.includes("Passw0rd!") && !raw.includes("Admin123!"), "no plaintext passwords on disk");
    assert.ok(raw.includes("scrypt$"));
  });

  it("dashboard counts reflect the data", async () => {
    const c = (await admin.get("/api/admin/counts")).data;
    assert.ok(c.competitions >= 12 && c.news >= 4 && c.users >= 4 && typeof c.uploadsBytes === "number");
  });
});
