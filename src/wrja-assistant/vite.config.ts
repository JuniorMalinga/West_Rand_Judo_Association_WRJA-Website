import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'client',
  plugins: [react()],
  publicDir: '../public',
  server: {
    allowedHosts: [
      '3000-iwy1u9hd17896i2q7ga6o-4664b6cf.us5.manus.computer',
      '3000-ikvmdvrgoka1ha0s8yc9i-b4293816.us5.manus.computer',
      '3000-iira9g6lsova2gx463ytm-14157491.us4.manus.computer',
    ],
  },
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
