// Deletes the local database and uploaded files, then re-seeds on next start.
//   npm run db:reset
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const dataDir = process.env.WRJA_DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question(`This deletes ${dataDir} (database + uploads). Type "yes" to continue: `, (answer) => {
  rl.close();
  if (answer.trim().toLowerCase() !== "yes") return console.log("Cancelled.");
  fs.rmSync(dataDir, { recursive: true, force: true });
  console.log("Local database removed. Start the server again to re-create it with the default content.");
});
