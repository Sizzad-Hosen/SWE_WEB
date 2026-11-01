import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  publicDir: 'assets',
  server: { host: '0.0.0.0', port: 3000 },
  build: { outDir: 'dist/web', emptyOutDir: true },
});
