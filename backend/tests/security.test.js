import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createLimiter } from "../src/security.js";

describe("rate limiter", () => {
  it("blocks at the configured threshold and can be reset", () => {
    const limiter = createLimiter({ windowMs: 60_000, max: 2 });

    assert.equal(limiter.blocked("client"), 0);
    assert.equal(limiter.hit("client"), 1);
    assert.equal(limiter.blocked("client"), 0);
    assert.equal(limiter.hit("client"), 2);
    assert.ok(limiter.blocked("client") > 0);

    limiter.reset("client");
    assert.equal(limiter.blocked("client"), 0);
  });
});
