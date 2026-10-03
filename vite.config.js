import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

const onVercel = Boolean(process.env.VERCEL);

export default defineConfig({
  envDir: "./server",
  plugins: [react(), ...(onVercel ? [] : [cloudflare()])],
  server: {
    watch: { ignored: ["**/server/data/**"] },
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true, secure: false },
      "/uploads": { target: "http://localhost:5000", changeOrigin: true, secure: false },
    },
  },
});