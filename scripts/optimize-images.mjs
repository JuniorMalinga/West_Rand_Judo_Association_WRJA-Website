import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = "src/assets/images";
const MAX_WIDTH = 1920;
const MIN_BYTES = 250 * 1024;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

let saved = 0;

for (const file of walk(ROOT)) {
  const ext = path.extname(file).toLowerCase();
  const size = fs.statSync(file).size;
  if (![".jpg", ".jpeg", ".png"].includes(ext) || size < MIN_BYTES) continue;

  const image = sharp(file).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const buffer =
    ext === ".png"
      ? await image.png({ compressionLevel: 9 }).toBuffer()
      : await image.jpeg({ quality: 78, mozjpeg: true }).toBuffer();

  if (buffer.length < size) {
    const tempFile = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tempFile, buffer);
    try {
      fs.renameSync(tempFile, file);
    } catch (error) {
      fs.rmSync(tempFile, { force: true });
      throw error;
    }
    saved += size - buffer.length;
    console.log(`${file}: ${(size / 1024).toFixed(0)} KB -> ${(buffer.length / 1024).toFixed(0)} KB`);
  }
}

console.log(`Saved ${(saved / 1048576).toFixed(1)} MB`);