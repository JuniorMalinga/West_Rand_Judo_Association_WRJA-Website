import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Boots a real server on a random port with a throw-away database.
export async function startServer() {
  const port = 5100 + Math.floor(Math.random() * 800);
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "wrja-test-"));
  const child = spawn(process.execPath, ["server.js"], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(port), WRJA_DATA_DIR: dataDir },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const base = `http://127.0.0.1:${port}`;
  const started = Date.now();
  for (;;) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) break;
    } catch {
      // not up yet
    }
    if (Date.now() - started > 15000) throw new Error("server did not start");
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return {
    base,
    dataDir,
    stop() {
      child.kill();
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

// A tiny browser: keeps cookies between requests and sends the CSRF header.
export function browser(base) {
  let cookie = "";
  const request = async (method, url, body, extraHeaders = {}) => {
    const headers = { "X-Requested-With": "wrja-web", ...extraHeaders };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (cookie) headers.Cookie = cookie;
    const response = await fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0].endsWith("=") ? "" : setCookie.split(";")[0];
    let data = null;
    const type = response.headers.get("content-type") || "";
    if (type.includes("json")) data = await response.json();
    return { status: response.status, data, headers: response.headers, response };
  };
  return {
    get: (url, headers) => request("GET", url, undefined, headers),
    post: (url, body = {}, headers) => request("POST", url, body, headers),
    put: (url, body, headers) => request("PUT", url, body, headers),
    patch: (url, body, headers) => request("PATCH", url, body, headers),
    del: (url, headers) => request("DELETE", url, undefined, headers),
    get cookie() { return cookie; },
    set cookie(value) { cookie = value; },
    async login(email, password) {
      const result = await request("POST", "/api/auth/login", { email, password });
      if (result.status !== 200) throw new Error(`login failed: ${result.status} ${JSON.stringify(result.data)}`);
      return result;
    },
  };
}

// Smallest valid files for each type (only the signature matters to the server).
export const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
export const PDF_DATA_URL = `data:application/pdf;base64,${Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF").toString("base64")}`;
export const SVG_DATA_URL = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString("base64")}`;
export const HTML_AS_PNG = `data:image/png;base64,${Buffer.from("<html><script>alert(1)</script></html>").toString("base64")}`;

export const ADMIN = ["admin@wrja.co.za", "Admin123!"];
export const MEMBER = ["user@wrja.co.za", "User123!"];
