import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { landingAdmin } from './admin-kit/vite-plugin.ts'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works from any subpath (e.g. GitHub Pages)
  base: './',
  plugins: [react(), tailwindcss(), landingAdmin()],
})
