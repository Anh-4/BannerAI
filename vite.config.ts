import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' để asset dùng đường dẫn tương đối -> Electron load qua file:// chạy được.
export default defineConfig({
  plugins: [react()],
  base: './',
  // host 127.0.0.1: bind IPv4 để khớp wait-on/Electron (Windows hay bind IPv6 ::1 gây kẹt).
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { outDir: 'dist' },
});
