import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clearSession, setSession } from "../src/auth.js";

const session = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_in: 3600,
};

function response() {
  return { setHeader(name, value) { this[name] = value; } };
}

describe("session cookie persistence", () => {
  it("uses session cookies and removes any legacy remember cookie", () => {
    const res = response();
    setSession({ secure: false }, res, session);
    assert.equal(res["Set-Cookie"].length, 3);
    assert.match(res["Set-Cookie"][0], /^wrja_access=.*SameSite=Lax$/);
    assert.match(res["Set-Cookie"][1], /^wrja_refresh=.*SameSite=Lax$/);
    assert.ok(res["Set-Cookie"][0].includes("Max-Age=") === false);
    assert.ok(res["Set-Cookie"][1].includes("Max-Age=") === false);
    assert.match(res["Set-Cookie"][2], /^wrja_remember=;.*Max-Age=0$/);
  });

  it("does not persist access or refresh cookies", () => {
    const res = response();
    setSession({ secure: true }, res, session);
    assert.equal(res["Set-Cookie"].length, 3);
    assert.ok(res["Set-Cookie"][0].includes("; Secure"));
    assert.ok(res["Set-Cookie"][1].includes("; Secure"));
    assert.ok(res["Set-Cookie"][0].includes("Max-Age=") === false);
    assert.ok(res["Set-Cookie"][1].includes("Max-Age=") === false);
  });

  it("clears access, refresh, and persistence cookies on logout", () => {
    const res = response();
    clearSession({ secure: false }, res);
    assert.deepEqual(res["Set-Cookie"].map((cookie) => cookie.split("=")[0]), [
      "wrja_access", "wrja_refresh", "wrja_remember",
    ]);
    assert.ok(res["Set-Cookie"].every((cookie) => cookie.includes("Max-Age=0")));
  });
});