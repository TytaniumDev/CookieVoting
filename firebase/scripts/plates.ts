import type { Box } from '@cookie-voting/shared'
import { readFile } from 'node:fs/promises'

export const PLATES_DIR = new URL('../../fixtures/plates/', import.meta.url)

/**
 * Ground-truth cookie boxes for a photo in fixtures/plates, from the `.json` file beside
 * it: normalised to the photo and in reading order, as the plate editor saves them.
 */
export async function plateBoxes(photoFile: string): Promise<Box[]> {
  const json = await readFile(new URL(photoFile.replace(/\.jpe?g$/i, '.json'), PLATES_DIR), 'utf8')
  return (JSON.parse(json) as { cookies: { box: Box }[] }).cookies.map((c) => c.box)
}
