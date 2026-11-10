import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // ../shared (tokens e bairros) é usado pelo app e pela web
  server: { fs: { allow: [path.resolve(__dirname, '..')] } },
})
