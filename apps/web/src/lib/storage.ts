import { paths, type PlatePhoto } from '@cookie-voting/shared'
import { doc, updateDoc } from 'firebase/firestore'
import {
  connectStorageEmulator,
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage'
import { app, db, emulatorHost, usingEmulators } from './firebase.ts'
import { preparePlatePhoto } from './photo.ts'

/** Cloud Storage for plate photos. Admin-only, so it's kept out of voter chunks. */
export const storage = getStorage(app)

if (usingEmulators) connectStorageEmulator(storage, emulatorHost, 9199)

/**
 * Shrinks a photo and uploads it as a plate photo for the event, without attaching it
 * to a category. `onProgress` gets 0..1 while the upload runs.
 */
export async function storePlatePhoto(
  eventId: string,
  file: Blob,
  onProgress: (fraction: number) => void,
): Promise<PlatePhoto> {
  const prepared = await preparePlatePhoto(file)
  const path = paths.platePhoto(eventId, `${crypto.randomUUID()}.jpg`)
  const photoRef = ref(storage, path)
  const task = uploadBytesResumable(photoRef, prepared.blob, {
    contentType: 'image/jpeg',
    // Every upload gets a new name, so browsers can keep it forever.
    cacheControl: 'public, max-age=31536000, immutable',
  })
  task.on('state_changed', (snapshot) =>
    onProgress(snapshot.totalBytes ? snapshot.bytesTransferred / snapshot.totalBytes : 0),
  )
  await task
  return {
    path,
    url: await getDownloadURL(photoRef),
    width: prepared.width,
    height: prepared.height,
  }
}

/** Uploads a category's plate photo and deletes the one it replaces. */
export async function uploadPlatePhoto(
  eventId: string,
  categoryId: string,
  file: Blob,
  previous: PlatePhoto | null,
  onProgress: (fraction: number) => void,
): Promise<void> {
  const photo = await storePlatePhoto(eventId, file, onProgress)
  await updateDoc(doc(db, paths.category(eventId, categoryId)), { photo })
  if (previous) await deletePlatePhoto(previous)
}

/** Deletes a stored plate photo; a photo that's already gone is fine. */
export async function deletePlatePhoto(photo: PlatePhoto): Promise<void> {
  try {
    await deleteObject(ref(storage, photo.path))
  } catch (error) {
    if ((error as { code?: string }).code !== 'storage/object-not-found') throw error
  }
}
