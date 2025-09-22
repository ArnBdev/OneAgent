import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy WebSocket endpoint to the unified MCP server during development
      '/ws/mission-control': {
        target: 'http://127.0.0.1:8083',
        changeOrigin: true,
        ws: true,
      },
      // REST metrics endpoints (if UI served separately during dev)
      '/api': {
        target: 'http://127.0.0.1:8083',
        changeOrigin: true,
      },
    },
  },
});
