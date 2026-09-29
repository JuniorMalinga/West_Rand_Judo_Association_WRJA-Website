// Client-side image handling for admin uploads.
//
// The site has no server, so uploaded images are shrunk in the browser and
// kept as data URLs. Shrinking matters: an unprocessed phone photo is several
// megabytes and would fill localStorage after one or two uploads.

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_INPUT_BYTES = 12 * 1024 * 1024;

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That file could not be opened as an image."));
    image.src = src;
  });
}

/**
 * Validate, resize and re-encode an image file.
 * @param {File} file
 * @param {{ maxSize?: number, type?: "image/jpeg"|"image/png", quality?: number }} options
 * @returns {Promise<string>} data URL
 */
export async function processImageFile(file, { maxSize = 1400, type = "image/jpeg", quality = 0.82 } = {}) {
  if (!file) throw new Error("No file selected.");
  if (!ACCEPTED.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG, WebP or GIF image.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("That image is over 12 MB. Please choose a smaller one.");
  }

  const source = await readAsDataUrl(file);
  const image = await loadImage(source);

  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (type === "image/jpeg") {
    // JPEG has no transparency – paint white so transparent PNGs don't go black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL(type, quality);
}

// Opens a data URL in a new tab. Browsers block navigating straight to
// data: URLs, so convert to a temporary blob URL first.
export function openDataUrl(dataUrl) {
  try {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/data:(.*?);base64/)?.[1] || "application/octet-stream";
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(url, "_blank", "noopener");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    window.open(dataUrl, "_blank", "noopener");
  }
}

export { readAsDataUrl };
