import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { app, emulatorHost, usingEmulators } from './firebase.ts'

/** Cloud Storage for plate photos. Admin-only, so it's kept out of voter chunks. */
export const storage = getStorage(app)

if (usingEmulators) connectStorageEmulator(storage, emulatorHost, 9199)
