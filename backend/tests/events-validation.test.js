import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanCompetition, cleanEvent } from "../src/routes/api.js";

const validEvent = {
  name: "Winter grading",
  type: "Grading",
  date: "2026-12-12",
  location: "WRJA Dojo",
  applicationSheetUrl: "https://docs.google.com/spreadsheets/d/example/edit",
  qrCodeImage: "https://images.example/qr-code.png",
};

describe("standard event validation", () => {
  it("accepts a standard event with its Sheets link and QR image link", () => {
    const event = cleanEvent(validEvent);
    assert.equal(event.type, "Grading");
    assert.equal(event.image, "/uploads/public/default-event.jpeg");
    assert.equal(event.applicationSheetUrl, validEvent.applicationSheetUrl);
    assert.equal(event.qrCodeImage, validEvent.qrCodeImage);
  });

  it("accepts a standard event without a QR code", () => {
    const event = cleanEvent({ ...validEvent, qrCodeImage: "" });
    assert.equal(event.qrCodeImage, "");
  });

  describe("competition image validation", () => {
    it("accepts an image URL returned by the WRJA admin uploader", () => {
      const previousUrl = process.env.SUPABASE_URL;
      const previousAnonKey = process.env.SUPABASE_ANON_KEY;
      process.env.SUPABASE_URL = "https://wrja-test.supabase.co";
      process.env.SUPABASE_ANON_KEY = "test-anon-key";

      try {
        const uploadedImage = "https://wrja-test.supabase.co/storage/v1/object/public/public-media/admin/2026/550e8400-e29b-41d4-a716-446655440000.jpg";
        const competition = cleanCompetition({
          name: "Winter competition",
          type: "Competition",
          description: "A test competition.",
          date: "2026-12-12",
          location: "WRJA Dojo",
          image: uploadedImage,
        }, "test-access-token");

        assert.equal(competition.image, uploadedImage);
      } finally {
        if (previousUrl === undefined) delete process.env.SUPABASE_URL;
        else process.env.SUPABASE_URL = previousUrl;
        if (previousAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY;
        else process.env.SUPABASE_ANON_KEY = previousAnonKey;
      }
    });

    it("rejects arbitrary remote image URLs", () => {
      const previousUrl = process.env.SUPABASE_URL;
      const previousAnonKey = process.env.SUPABASE_ANON_KEY;
      process.env.SUPABASE_URL = "https://wrja-test.supabase.co";
      process.env.SUPABASE_ANON_KEY = "test-anon-key";

      try {
        assert.throws(() => cleanCompetition({
          name: "Winter competition",
          type: "Competition",
          description: "A test competition.",
          date: "2026-12-12",
          location: "WRJA Dojo",
          image: "https://images.example/photo.jpg",
        }, "test-access-token"), /uploaded through the admin uploader/);
      } finally {
        if (previousUrl === undefined) delete process.env.SUPABASE_URL;
        else process.env.SUPABASE_URL = previousUrl;
        if (previousAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY;
        else process.env.SUPABASE_ANON_KEY = previousAnonKey;
      }
    });
  });

  it("rejects competitions from the standard event workflow", () => {
    assert.throws(() => cleanEvent({ ...validEvent, type: "Competition" }), { status: 400 });
  });

  it("requires a Google Sheets spreadsheet URL", () => {
    assert.throws(() => cleanEvent({ ...validEvent, applicationSheetUrl: "https://example.com/form" }), { status: 400 });
    assert.throws(() => cleanEvent({ ...validEvent, applicationSheetUrl: "" }), { status: 400 });
  });
});