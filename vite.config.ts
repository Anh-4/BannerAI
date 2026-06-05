import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' để asset dùng đường dẫn tương đối -> Electron load qua file:// chạy được.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, strictPort: true },
  build: { outDir: 'dist' },
});
