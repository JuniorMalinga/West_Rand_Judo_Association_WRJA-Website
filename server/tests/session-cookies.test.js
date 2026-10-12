import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clearSession, setSession } from "../auth.js";

const session = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_in: 3600,
};

function response() {
  return { setHeader(name, value) { this[name] = value; } };
}

describe("session cookie persistence", () => {
  it("uses session cookies unless Remember me was selected", () => {
    const res = response();
    setSession({ secure: false }, res, session);
    assert.equal(res["Set-Cookie"].length, 3);
    assert.match(res["Set-Cookie"][0], /^wrja_access=.*SameSite=Lax$/);
    assert.match(res["Set-Cookie"][1], /^wrja_refresh=.*SameSite=Lax$/);
    assert.match(res["Set-Cookie"][2], /^wrja_remember=;.*Max-Age=0$/);
  });

  it("persists the refresh cookie for 30 days when Remember me is selected", () => {
    const res = response();
    setSession({ secure: true }, res, session, { remember: true });
    assert.match(res["Set-Cookie"][0], /Max-Age=3600/);
    assert.match(res["Set-Cookie"][1], /Max-Age=2592000/);
    assert.match(res["Set-Cookie"][1], /; Secure/);
    assert.match(res["Set-Cookie"][2], /^wrja_remember=1;.*Max-Age=2592000/);
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