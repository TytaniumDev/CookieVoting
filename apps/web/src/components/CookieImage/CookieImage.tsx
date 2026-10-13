import type { Box, PlatePhoto } from '@cookie-voting/shared'
import type { CSSProperties } from 'react'

export interface CookieImageProps {
  photo: Pick<PlatePhoto, 'url' | 'width' | 'height'>
  /** The cookie's box on the photo, normalised to 0..1. */
  box: Box
  /** Describes the cookie; pass '' when the image is decorative (e.g. next to a label). */
  alt: string
  className?: string
  /** Extra styles for the window, e.g. a width that fits it inside a square. */
  style?: CSSProperties
}

/**
 * One cookie, shown by looking at its plate photo through a window the size of its box
 * (ARCHITECTURE.md → Rendering a cookie). No crops are stored: every cookie on a plate
 * shares one cached photo download, and box edits show up instantly.
 */
export function CookieImage({ photo, box, alt, className = '', style }: CookieImageProps) {
  const aspectRatio = (box.width * photo.width) / (box.height * photo.height)
  return (
    <div
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={`relative overflow-hidden bg-surface-muted ${className}`}
      style={{ ...style, aspectRatio }}
    >
      <img
        src={photo.url}
        alt=""
        draggable={false}
        className="absolute max-w-none select-none"
        style={{
          width: `${100 / box.width}%`,
          left: `${(-box.x / box.width) * 100}%`,
          top: `${(-box.y / box.height) * 100}%`,
        }}
      />
    </div>
  )
}
