/**
 * Where the ornaments hang. The garland is the path `GARLAND_PATH` in a 400 × 60 box
 * stretched across the whole width; each ornament's string starts on that curve.
 */
export const GARLAND_PATH = 'M0 10 Q100 46 200 22 T400 10'
export const GARLAND_HEIGHT = 60

/** The garland's height (in viewBox units, 0–60) at `u`, a position from 0 to 400. */
export function garlandY(u: number): number {
  if (u <= 200) {
    const t = u / 200
    return (1 - t) ** 2 * 10 + 2 * (1 - t) * t * 46 + t * t * 22
  }
  const t = (u - 200) / 200
  return (1 - t) ** 2 * 22 + 2 * (1 - t) * t * -2 + t * t * 10
}

interface Spot {
  /** Centre, as a fraction of the design width. */
  x: number
  /** Top of the ball, in design px. */
  top: number
  /** Ball diameter, in design px. */
  size: number
}

interface Design {
  width: number
  height: number
  /** In place order: 1st, 2nd, 3rd. 1st hangs lowest and biggest, in the middle. */
  spots: readonly [Spot, Spot, Spot]
}

/** Phones and other tall spaces. */
const TALL: Design = {
  width: 343,
  height: 480,
  spots: [
    { x: 0.5, top: 248, size: 160 },
    { x: 0.2, top: 58, size: 116 },
    { x: 0.8, top: 78, size: 112 },
  ],
}

/** Laptops: short and wide. */
const WIDE: Design = {
  width: 620,
  height: 380,
  spots: [
    { x: 0.5, top: 82, size: 200 },
    { x: 0.18, top: 60, size: 150 },
    { x: 0.82, top: 70, size: 145 },
  ],
}

export interface PlacedOrnament {
  /** Centre of the ball, from the left edge of the area. */
  x: number
  /** Where the string meets the garland, from the top. */
  hookY: number
  /** Top of the ball, from the top. */
  ballTop: number
  size: number
}

export interface OrnamentLayout {
  /** How tall the garland is drawn, in px. */
  garlandHeight: number
  ornaments: PlacedOrnament[]
}

/**
 * Fits the design that suits a `width` × `height` area into it and places up to three
 * ornaments, in place order.
 */
export function layoutOrnaments(width: number, height: number, count: number): OrnamentLayout {
  const design = width / Math.max(height, 1) >= 1.25 ? WIDE : TALL
  const scale = Math.min(width / design.width, height / design.height, 1.5)
  const left = (width - design.width * scale) / 2
  const garlandHeight = GARLAND_HEIGHT * scale
  const ornaments = design.spots.slice(0, count).map((spot) => {
    const x = left + spot.x * design.width * scale
    return {
      x,
      hookY: garlandY((x / Math.max(width, 1)) * 400) * scale,
      ballTop: spot.top * scale,
      size: spot.size * scale,
    }
  })
  return { garlandHeight, ornaments }
}
