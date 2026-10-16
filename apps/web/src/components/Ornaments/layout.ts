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
  /** 1st hangs below the others' tags, which would otherwise sit over its ball. */
  stacked: boolean
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
  stacked: true,
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
  stacked: false,
}

/**
 * The gift tag under the 1st-place ball, in px: its margin, name and points. Tags keep
 * their size while the balls scale, so this is kept free below the lowest ball.
 */
export const TAG_HEIGHT = 72

/** The gift tag under a 2nd- or 3rd-place ball, in px: its margin, name and points. */
export const SIDE_TAG_HEIGHT = 68

/** The "Tied 1st" line a tag gains when its place is shared, in px. */
export const TIE_LINE_HEIGHT = 16

/** Which tags carry a "Tied …" line, so they get room for it. */
export interface TagTies {
  /** The 1st-place tag. */
  first?: boolean
  /** Either side tag (2nd or 3rd); the lower one decides where 1st hangs. */
  sides?: boolean
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
 * ornaments, in place order, leaving room for their tags (taller when `ties` say so).
 */
export function layoutOrnaments(
  width: number,
  height: number,
  count: number,
  ties: TagTies = {},
): OrnamentLayout {
  const design = width / Math.max(height, 1) >= 1.25 ? WIDE : TALL
  const tag = TAG_HEIGHT + (ties.first ? TIE_LINE_HEIGHT : 0)
  const sideTag = SIDE_TAG_HEIGHT + (ties.sides ? TIE_LINE_HEIGHT : 0)
  const [first, ...sides] = design.spots
  const lowest = first.top + first.size
  // Bottom of the lower side ball, in design px: its tag hangs below it at a fixed size.
  const sideBottom = design.stacked ? Math.max(...sides.map((s) => s.top + s.size)) : 0
  const scale = Math.max(
    Math.min(
      width / design.width,
      height / design.height,
      (height - tag) / lowest,
      design.stacked ? (height - tag - sideTag) / (sideBottom + first.size) : 1.5,
      1.5,
    ),
    0,
  )
  const left = (width - design.width * scale) / 2
  const garlandHeight = GARLAND_HEIGHT * scale
  const ornaments = design.spots.slice(0, count).map((spot, index) => {
    const x = left + spot.x * design.width * scale
    const top = spot.top * scale
    return {
      x,
      hookY: garlandY((x / Math.max(width, 1)) * 400) * scale,
      ballTop:
        index === 0 && design.stacked && count > 1
          ? Math.max(top, sideBottom * scale + sideTag)
          : top,
      size: spot.size * scale,
    }
  })
  return { garlandHeight, ornaments }
}
