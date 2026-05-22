import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/v1/pets': { target: 'http://localhost:3002', changeOrigin: true },
      '/api/v1/patients': { target: 'http://localhost:3002', changeOrigin: true },
      '/api/v1/reminders': { target: 'http://localhost:3003', changeOrigin: true },
      '/api/v1/dashboard': { target: 'http://localhost:3005', changeOrigin: true },
      '/api/v1/notifications': { target: 'http://localhost:3006', changeOrigin: true },
      '/api/v1/admin/notifications': { target: 'http://localhost:3006', changeOrigin: true },
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
