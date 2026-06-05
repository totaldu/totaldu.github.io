// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({        // ← export default 객체 → defineConfig()로 감싸기
  base: '/',                         // ← CSS/JS 경로를 절대경로로 출력 (404 리다이렉트 후 replaceState 시 상대경로 깨짐 방지)
  plugins: [react()],
  resolve: {                         // ← 이 블록 추가
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  }
})
