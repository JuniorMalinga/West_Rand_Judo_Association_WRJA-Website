import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, MEMBER, browser, startServer } from "./helpers.js";

let server;
before(async () => { server = await startServer(); });
after(() => server.stop());

describe("login & sessions", () => {
  it("logs in the default admin and sets a hardened cookie", async () => {
    const b = browser(server.base);
    const { status, data, headers } = await b.login(...ADMIN);
    assert.equal(status, 200);
    assert.equal(data.user.role, "admin");
    assert.equal(data.user.passwordHash, undefined, "never leaks the hash");
    const cookie = headers.get("set-cookie");
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    const b = browser(server.base);
    const wrong = await b.post("/api/auth/login", { email: ADMIN[0], password: "nope-nope1" });
    const unknown = await b.post("/api/auth/login", { email: "ghost@nowhere.co", password: "nope-nope1" });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.data.error, unknown.data.error);
  });

  it("is not fooled by SQL injection in the login form", async () => {
    const b = browser(server.base);
    const r = await b.post("/api/auth/login", { email: "' OR 1=1 --", password: "' OR '1'='1" });
    assert.equal(r.status, 401);
    const r2 = await b.post("/api/auth/login", { email: `${ADMIN[0]}' --`, password: "x" });
    assert.equal(r2.status, 401);
  });

  it("locks an account after 5 failed attempts, even with the right password", async () => {
    const b = browser(server.base);
    for (let i = 0; i < 5; i += 1) {
      const r = await b.post("/api/auth/login", { email: MEMBER[0], password: "wrong-pass1" });
      assert.equal(r.status, 401);
    }
    const locked = await b.post("/api/auth/login", { email: MEMBER[0], password: MEMBER[1] });
    assert.equal(locked.status, 429);
    assert.ok(locked.headers.get("retry-after"));
  });

  it("logout really ends the session server-side", async () => {
    const b = browser(server.base);
    await b.login(...ADMIN);
    const saved = b.cookie;
    assert.equal((await b.get("/api/admin/counts")).status, 200);
    await b.post("/api/auth/logout");
    // replaying the old cookie must fail
    const replay = browser(server.base);
    replay.cookie = saved;
    assert.equal((await replay.get("/api/admin/counts")).status, 401);
  });

  it("ignores forged or tampered session cookies", async () => {
    const b = browser(server.base);
    b.cookie = "wrja_session=not-a-real-token";
    assert.equal((await b.get("/api/auth/me")).data.user, null);
    b.cookie = "wrja_session=" + "A".repeat(43);
    assert.equal((await b.get("/api/admin/users")).status, 401);
    // the classic localStorage trick has no effect either: the server never reads it
    b.cookie = "";
    assert.equal((await b.get("/api/admin/users", { "X-Role": "admin" })).status, 401);
  });
});

describe("signup", () => {
  it("creates a member but never lets anyone self-assign admin", async () => {
    const b = browser(server.base);
    const bad = await b.post("/api/auth/signup", { firstName: "Eve", lastName: "Hack", email: "eve@x.co", password: "Passw0rd!", role: "admin" });
    assert.equal(bad.status, 400);

    const ok = await b.post("/api/auth/signup", { firstName: "Ann", lastName: "Lee", email: "ann@x.co", password: "Passw0rd!", role: "guardian" });
    assert.equal(ok.status, 201);
    assert.equal(ok.data.user.role, "guardian");
  });

  it("enforces password strength, age and unique email on the server", async () => {
    const b = browser(server.base);
    const base = { firstName: "Bo", lastName: "Kim", email: "bo@x.co", role: "guardian" };
    assert.equal((await b.post("/api/auth/signup", { ...base, password: "short1" })).status, 400);
    assert.equal((await b.post("/api/auth/signup", { ...base, password: "onlyletters" })).status, 400);
    assert.equal((await b.post("/api/auth/signup", { ...base, role: "athlete", dateOfBirth: "2015-01-01", password: "Passw0rd!" })).status, 400);
    assert.equal((await b.post("/api/auth/signup", { ...base, email: ADMIN[0], password: "Passw0rd!" })).status, 409);
  });
});

describe("CSRF protection", () => {
  it("blocks state-changing requests without the security header", async () => {
    const r = await fetch(`${server.base}/api/auth/logout`, { method: "POST" });
    assert.equal(r.status, 403);
  });
  it("blocks requests from an untrusted origin", async () => {
    const b = browser(server.base);
    const r = await b.post("/api/messages", { name: "x" }, { Origin: "https://evil.example" });
    assert.equal(r.status, 403);
  });
  it("does not reflect arbitrary origins in CORS", async () => {
    const r = await fetch(`${server.base}/api/news`, { headers: { Origin: "https://evil.example" } });
    assert.equal(r.headers.get("access-control-allow-origin"), null);
    const ok = await fetch(`${server.base}/api/news`, { headers: { Origin: "http://localhost:5173" } });
    assert.equal(ok.headers.get("access-control-allow-origin"), "http://localhost:5173");
  });
});

describe("who can see and do what", () => {
  it("anonymous visitors get a teaser only – no registration or payment details", async () => {
    const r = await browser(server.base).get("/api/competitions");
    assert.equal(r.status, 200);
    assert.ok(r.data.items.length >= 10);
    for (const c of r.data.items) {
      assert.equal(c.registrationUrl, undefined);
      assert.equal(c.paymentInstructions, undefined);
      assert.equal(c.paymentUrl, undefined);
    }
  });

  it("events need a login (application links and QR codes are for members)", async () => {
    const anon = await browser(server.base).get("/api/events");
    assert.equal(anon.status, 401);
  });

  it("news is public", async () => {
    const r = await browser(server.base).get("/api/news");
    assert.equal(r.status, 200);
    assert.equal(r.data.items.length, 4);
    assert.ok(r.data.items[0].sortDate >= r.data.items[1].sortDate, "newest first");
  });

  it("every admin endpoint refuses anonymous users", async () => {
    const b = browser(server.base);
    const endpoints = [
      ["get", "/api/admin/counts"], ["get", "/api/admin/users"], ["get", "/api/admin/messages"], ["get", "/api/admin/payments"],
      ["post", "/api/admin/competitions", {}], ["post", "/api/admin/events", {}], ["post", "/api/admin/news", {}],
      ["post", "/api/admin/uploads", {}], ["put", "/api/admin/competitions/nre", {}], ["del", "/api/admin/events/1"],
      ["post", "/api/admin/users", {}], ["patch", "/api/admin/messages/x", {}],
    ];
    for (const [method, url, body] of endpoints) {
      const r = await b[method](url, body);
      assert.equal(r.status, 401, `${method.toUpperCase()} ${url} should be 401, got ${r.status}`);
    }
  });

  it("a normal member is forbidden from every admin endpoint", async () => {
    const admin = browser(server.base);
    await admin.login(...ADMIN);
    await admin.post("/api/admin/users", { firstName: "Mem", lastName: "Ber", email: "member1@x.co", password: "Passw0rd!", role: "athlete" });

    const m = browser(server.base);
    await m.login("member1@x.co", "Passw0rd!");
    for (const [method, url, body] of [
      ["get", "/api/admin/counts"], ["get", "/api/admin/users"], ["post", "/api/admin/competitions", { name: "x", type: "y" }],
      ["put", "/api/admin/news/1", {}], ["del", "/api/admin/events/1"], ["post", "/api/admin/uploads", {}],
      ["post", "/api/admin/users", { firstName: "a", lastName: "b", email: "c@d.co", password: "Passw0rd!", role: "admin" }],
    ]) {
      const r = await m[method](url, body);
      assert.equal(r.status, 403, `${method.toUpperCase()} ${url} should be 403, got ${r.status}`);
    }
    // members do see full competition and event details
    const comps = await m.get("/api/competitions");
    assert.ok(comps.data.items.some((c) => "paymentInstructions" in c));
    assert.equal((await m.get("/api/events")).status, 200);
    // knowledge refresh is admin-only too
    assert.equal((await m.post("/api/knowledge/refresh")).status, 403);
  });

  it("a demoted admin loses access immediately, without logging in again", async () => {
    const root = browser(server.base);
    await root.login(...ADMIN);
    await root.post("/api/admin/users", { firstName: "Tmp", lastName: "Admin", email: "tmp@x.co", password: "Passw0rd!", role: "admin" });
    const tmp = browser(server.base);
    await tmp.login("tmp@x.co", "Passw0rd!");
    assert.equal((await tmp.get("/api/admin/counts")).status, 200);

    const users = (await root.get("/api/admin/users")).data.items;
    const target = users.find((u) => u.email === "tmp@x.co");
    const put = await root.put(`/api/admin/users/${target.id}`, { ...target, role: "athlete" });
    assert.equal(put.status, 200);
    assert.equal((await tmp.get("/api/admin/counts")).status, 401, "old session was revoked");
  });
});
