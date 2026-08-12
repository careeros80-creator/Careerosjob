import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VS1 dashboard runs on port 3000 (per the VS1 spec).
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, host: true, strictPort: true },
  preview: { port: 3000, strictPort: true },
});
