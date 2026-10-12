import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSchoolSlug } from "../eventsRepo.js";
import { cleanSchool } from "../routes/api.js";

const schoolInput = {
  name: "SA Schools Novice",
  description: "A school judo competition.",
  date: "2026-11-14",
  location: "WRJA Dojo",
};

describe("school competition management", () => {
  it("keeps school records under the reserved school slug prefix", () => {
    assert.equal(isSchoolSlug("sa-schools-novice"), true);
    assert.equal(isSchoolSlug("sa-schools-advanced"), true);
    assert.equal(isSchoolSlug("west-rand-grand-slam"), false);
  });

  it("uses the generated school image when the admin does not choose an image", () => {
    const school = cleanSchool({ ...schoolInput, type: "Competition" });
    assert.equal(school.type, "Schools competition");
    assert.equal(school.image, "/uploads/public/default-school.jpeg");
  });
});