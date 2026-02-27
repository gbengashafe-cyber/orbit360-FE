import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM: define __filename/__dirname for compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      // Forward API requests during development to backend running on port 3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
    resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
}) 