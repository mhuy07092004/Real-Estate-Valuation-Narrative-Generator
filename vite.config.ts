import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  root: 'frontend',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Dev-only: forwards frontend's relative /api/... fetches to the
      // Express backend (backend/.env PORT, default 4000). Without this,
      // /api/geocode (and every other /api/* call) 404s against the Vite
      // dev server instead of reaching the real backend.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
