/** Reads a JPEG's pixel size from its start-of-frame marker. */
export function jpegSize(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getUint16(0) !== 0xffd8) throw new Error('Not a JPEG')
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error(`Bad JPEG marker at ${offset}`)
    const marker = bytes[offset + 1]!
    const length = view.getUint16(offset + 2)
    // SOF0–SOF15, except DHT (C4), JPG (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) }
    }
    offset += 2 + length
  }
  throw new Error('No JPEG frame header found')
}
