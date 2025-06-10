import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },  server: {
    port: 3001,
    proxy: {
      '/api/chat': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/system': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/performance': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
})
