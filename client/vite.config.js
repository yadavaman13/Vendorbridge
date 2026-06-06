import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://cohort2-0-backend-1-kphk.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
