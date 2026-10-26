import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPasswordResetCode, buildPasswordResetRequest } from "../src/routes/api.js";
import {
  PASSWORD_RESET_OTP_TTL_SECONDS,
  PASSWORD_RESET_RESEND_WINDOW_MS,
  passwordResetResendDelayMs,
} from "../src/passwordResetPolicy.js";

describe("password reset request validation", () => {
  it("accepts full name, account email, and optional phone", () => {
    assert.deepEqual(buildPasswordResetRequest({
      fullName: "  Ayesha  Khan ",
      email: "AYESHA@example.com",
      phone: "+27 82 123 4567",
    }), {
      fullName: "Ayesha Khan",
      email: "ayesha@example.com",
      phone: "+27 82 123 4567",
    });

  });

  it("accepts a request without a phone number", () => {
    assert.deepEqual(buildPasswordResetRequest({
      fullName: "Ayesha Khan",
      email: "ayesha@example.com",
    }), {
      fullName: "Ayesha Khan",
      email: "ayesha@example.com",
      phone: "",
    });
  });

  it("accepts the legacy name field while clients transition", () => {
    assert.deepEqual(buildPasswordResetRequest({
      name: "Ayesha Khan",
      email: "ayesha@example.com",
    }), {
      fullName: "Ayesha Khan",
      email: "ayesha@example.com",
      phone: "",
    });
  });

  describe("password reset code validation", () => {
    it("accepts an eight-digit code from Supabase Auth", () => {
      assert.equal(buildPasswordResetCode("12345678"), "12345678");
    });

    it("accepts numeric codes between six and twelve digits", () => {
      assert.equal(buildPasswordResetCode("123456"), "123456");
      assert.equal(buildPasswordResetCode("123456789012"), "123456789012");
    });

    it("rejects codes outside the supported length or containing non-digits", () => {
      for (const code of ["12345", "1234567890123", "1234abcd", ""]) {
        assert.throws(() => buildPasswordResetCode(code), { status: 400 });
      }
    });
  });

  describe("password reset timing policy", () => {
    it("expires codes after ten minutes", () => {
      assert.equal(PASSWORD_RESET_OTP_TTL_SECONDS, 600);
    });

    it("resets the stepped resend schedule after 24 hours of inactivity", () => {
      assert.equal(PASSWORD_RESET_RESEND_WINDOW_MS, 24 * 60 * 60 * 1000);
    });

    it("steps resend delays from 30 seconds to 2 minutes, 5 minutes, then 30 minutes", () => {
      assert.deepEqual(
        [1, 2, 3, 4, 5].map(passwordResetResendDelayMs),
        [30_000, 120_000, 300_000, 1_800_000, 1_800_000],
      );
    });
  });

  it("rejects missing names and invalid account emails", () => {
    assert.throws(
      () => buildPasswordResetRequest({ email: "ayesha@example.com" }),
      { status: 400 },
    );
    assert.throws(
      () => buildPasswordResetRequest({ fullName: "Ayesha Khan", email: "not-an-email" }),
      { status: 400 },
    );
  });

  it("rejects a malformed optional phone number", () => {
    assert.throws(
      () => buildPasswordResetRequest({
        fullName: "Ayesha Khan",
        email: "ayesha@example.com",
        phone: "abc1234567",
      }),
      { status: 400 },
    );
  });
});
