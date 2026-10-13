import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The Firestore SDK (realtime listeners) is ~500 kB minified, ~150 kB gzipped, on its
    // own; it loads with the first page that reads data. Warn only beyond that.
    chunkSizeWarningLimit: 600,
  },
})
