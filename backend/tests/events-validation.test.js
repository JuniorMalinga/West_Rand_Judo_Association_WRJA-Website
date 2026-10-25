import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanEvent } from "../src/routes/api.js";

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
    assert.equal(event.applicationSheetUrl, validEvent.applicationSheetUrl);
    assert.equal(event.qrCodeImage, validEvent.qrCodeImage);
  });

  it("rejects competitions from the standard event workflow", () => {
    assert.throws(() => cleanEvent({ ...validEvent, type: "Competition" }), { status: 400 });
  });

  it("requires a Google Sheets spreadsheet URL and a QR image or link", () => {
    assert.throws(() => cleanEvent({ ...validEvent, applicationSheetUrl: "https://example.com/form" }), { status: 400 });
    assert.throws(() => cleanEvent({ ...validEvent, applicationSheetUrl: "" }), { status: 400 });
    assert.throws(() => cleanEvent({ ...validEvent, qrCodeImage: "" }), { status: 400 });
  });
});