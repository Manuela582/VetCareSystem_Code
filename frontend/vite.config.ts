import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const VERCEL = {
  AUTH:          'https://vet-care-system-back-7182.vercel.app',
  CLINICAL:      'https://vet-care-system-back-78ez-git-main-saras-projects-50c2848b.vercel.app',
  REMINDERS:     'https://vet-care-system-back-fskb.vercel.app',
  DASHBOARD:     'https://vet-care-system-back-z1ld.vercel.app',
  NOTIFICATIONS: 'https://vet-care-system-back-l9by.vercel.app',
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/v1/admin/notifications': { target: VERCEL.NOTIFICATIONS, changeOrigin: true },
      '/api/v1/patients':            { target: VERCEL.CLINICAL,       changeOrigin: true },
      '/api/v1/reminders':           { target: VERCEL.REMINDERS,      changeOrigin: true },
      '/api/v1/dashboard':           { target: VERCEL.DASHBOARD,      changeOrigin: true },
      '/api/v1/notifications':       { target: VERCEL.NOTIFICATIONS,  changeOrigin: true },
      '/api':                        { target: VERCEL.AUTH,           changeOrigin: true },
    },
  },
});
