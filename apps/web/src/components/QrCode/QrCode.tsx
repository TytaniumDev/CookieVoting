import createQrCode from 'qrcode-generator'
import { useMemo } from 'react'

export interface QrCodeProps {
  /** The text to encode, e.g. the voter link. */
  value: string
  /** Describes the code for screen readers. */
  label: string
  className?: string
}

/** Quiet zone around the code, in modules; scanners need about four. */
const MARGIN = 4

/**
 * A QR code drawn as SVG in the theme's ink on a surface background, so it scales
 * crisply from a phone screen to a projector.
 */
export function QrCode({ value, label, className = '' }: QrCodeProps) {
  const { size, path } = useMemo(() => {
    const code = createQrCode(0, 'M')
    code.addData(value)
    code.make()
    const count = code.getModuleCount()
    let d = ''
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (code.isDark(row, col)) d += `M${col + MARGIN} ${row + MARGIN}h1v1h-1z`
      }
    }
    return { size: count + MARGIN * 2, path: d }
  }, [value])

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className={`rounded-control bg-surface text-ink ${className}`}
    >
      <path d={path} fill="currentColor" />
    </svg>
  )
}
