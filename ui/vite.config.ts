import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from parent directory
dotenv.config({ path: '../.env' })

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },  },  server: {
    port: parseInt(process.env.ONEAGENT_UI_PORT || '3001'),
    proxy: {
      '/api/chat': {
        target: process.env.ONEAGENT_UI_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/api/system': {
        target: process.env.ONEAGENT_MCP_URL || 'http://127.0.0.1:8083',
        changeOrigin: true,
      },
      '/api/performance': {
        target: process.env.ONEAGENT_MCP_URL || 'http://127.0.0.1:8083',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
})
