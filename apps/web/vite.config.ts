import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Deploy builds with a Sentry auth token (docs/SETUP.md §6) upload source maps so errors
// show the original code; the maps are deleted afterwards, so they're never served.
const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    uploadSourceMaps &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: { name: process.env.VITE_SENTRY_RELEASE },
        sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
        telemetry: false,
      }),
  ],
  build: {
    sourcemap: uploadSourceMaps ? 'hidden' : false,
    // The Firestore SDK (realtime listeners) is ~500 kB minified, ~150 kB gzipped, on its
    // own; it loads with the first page that reads data. Warn only beyond that.
    chunkSizeWarningLimit: 600,
  },
})
