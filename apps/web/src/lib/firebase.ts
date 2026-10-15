import { initializeApp, type FirebaseOptions } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import {
  browserLocalPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, waitForPendingWrites } from 'firebase/firestore'

/**
 * Firebase client for the whole app.
 *
 * - **Emulators** (`npm run dev`, tests, and builds with `VITE_USE_EMULATORS=true`): the
 *   `demo-cookie-voting` project on the local emulators. Ports match `firebase.json`.
 * - **Production**: the web config comes from Firebase Hosting's reserved
 *   `/__/firebase/init.json` URL, which serves the config of the project the site is
 *   deployed to (live site and preview channels alike), so nothing can drift.
 *
 * - **App Check** (production builds with `VITE_RECAPTCHA_SITE_KEY`): every request carries
 *   an invisible reCAPTCHA Enterprise attestation, so once the owner enforces it, scripts
 *   can't mint anonymous accounts and cast ballots outside the real page (docs/SETUP.md §7).
 *
 * Uses top-level await so importers get ready-to-use services. Storage lives in
 * `storage.ts` so voters, who never upload, don't download its SDK.
 */
export const usingEmulators = import.meta.env.DEV || import.meta.env.VITE_USE_EMULATORS === 'true'

const emulatorConfig: FirebaseOptions = {
  projectId: 'demo-cookie-voting',
  apiKey: 'demo-api-key',
  authDomain: 'demo-cookie-voting.firebaseapp.com',
  storageBucket: 'demo-cookie-voting.appspot.com',
  appId: '1:000000000000:web:0000000000000000000000',
}

async function loadHostingConfig(): Promise<FirebaseOptions> {
  const response = await fetch('/__/firebase/init.json')
  if (!response.ok) throw new Error(`Couldn't load the Firebase config (${response.status})`)
  return (await response.json()) as FirebaseOptions
}

const config = usingEmulators ? emulatorConfig : await loadHostingConfig()

export const app = initializeApp(config)

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
// Before any other service sends a request, so the first one already carries a token.
if (!usingEmulators && recaptchaSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  })
}

// initializeAuth rather than getAuth leaves out the popup/redirect code voters never use.
// Admin Google sign-in passes `browserPopupRedirectResolver` to signInWithPopup instead.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
})
export const db = getFirestore(app)

/** Same host the page came from, so a phone on the LAN can reach a laptop's emulators. */
export const emulatorHost = window.location.hostname

declare global {
  interface Window {
    /**
     * Emulator builds only: resolves once every write so far has reached the server, so
     * E2E tests can reload without losing one still in flight.
     */
    writesSavedForTests?: () => Promise<void>
  }
}

if (usingEmulators) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(db, emulatorHost, 8080)
  window.writesSavedForTests = () => waitForPendingWrites(db)
}
