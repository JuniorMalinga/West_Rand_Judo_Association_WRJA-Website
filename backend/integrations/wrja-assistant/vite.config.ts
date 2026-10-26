import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const allowedHosts = (process.env.ALLOWED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  root: 'client',
  plugins: [react()],
  publicDir: '../public',
  server: allowedHosts.length ? { allowedHosts } : undefined,
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['../tests/**/*.test.ts'],
  },
});
