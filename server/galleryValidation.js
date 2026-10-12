import { HttpError } from "./security.js";
import * as v from "./validate.js";

export const GALLERY_CATEGORIES = ["kids", "adult", "womens", "competitions", "training"];

export function cleanGalleryItem(body = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Gallery item must be an object.");
  }
  return {
    category: v.oneOf(body.category, GALLERY_CATEGORIES, "Category"),
    caption: v.text(body.caption, { field: "Caption", max: 160, required: true }),
    altText: v.text(body.altText, { field: "Alternative text", max: 240, required: true }),
    displayOrder: v.integer(body.displayOrder, { field: "Display order", min: 1, max: 9999, fallback: 100 }),
    photoUrl: v.text(body.photoUrl, { field: "Image", max: 2048, required: true }),
  };
}
