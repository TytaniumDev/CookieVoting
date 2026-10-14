import {
  clamp,
  clampBox,
  iou,
  MIN_BOX_SIZE,
  moveBox,
  readingOrder,
  resizeBox,
  type Box,
  type Cookie,
  type Corner,
  type PlatePhoto,
  type Point,
} from '@cookie-voting/shared'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { Button } from '../Button/Button.tsx'
import { Spinner } from '../Spinner/Spinner.tsx'

/** Tap-to-select, supplied by the page so this component stays model-free. */
export type TapToSelect =
  | { status: 'loading' }
  | { status: 'ready'; find: (photo: HTMLImageElement, point: Point) => Box | null }
  | { status: 'unavailable' }

export interface PlateEditorProps {
  photo: Pick<PlatePhoto, 'url' | 'width' | 'height'>
  cookies: readonly Cookie[]
  /**
   * Called after each finished edit with every cookie, sorted into reading order, and
   * the `cookies` the edit started from, so the save can merge with others' edits.
   */
  onChange: (cookies: Cookie[], base: readonly Cookie[]) => void
  /** Names the photo for screen readers, e.g. "Stars plate". */
  label: string
  /**
   * Tapping a cookie boxes it when this is ready; without it (or when it finds nothing),
   * a tap adds a box there for the admin to fit with its corner handles.
   */
  tapToSelect?: TapToSelect
  /**
   * A name tag for each cookie by id (its baker); null marks a cookie that still needs
   * one. Without it, boxes show only their numbers.
   */
  tags?: Readonly<Record<string, string | null>>
  /**
   * Called when a cookie is added (by a tap or Add cookie), after
   * `onChange`. Return true to open its menu straight away.
   */
  onCreate?: (cookie: Cookie) => boolean | void
  /** With this, tapping a box (or Enter on it) opens this menu next to it. */
  renderMenu?: (cookie: Cookie, actions: MenuActions) => ReactNode
  /**
   * Pixels to keep free under the photo when it sizes itself to the window, for
   * whatever the page shows below it and the page's bottom padding.
   */
  spaceBelow?: number
  /** A short prompt floating at the top of the photo, e.g. whose cookie to tap next. */
  banner?: ReactNode
  /** Makes ids for new cookies; tests pass a predictable one. */
  newId?: () => string
  className?: string
}

export interface MenuActions {
  /** The cookie's number on the plate, from 1. */
  number: number
  close: () => void
  remove: () => void
}

interface View {
  scale: number
  x: number
  y: number
}

type Gesture =
  | { kind: 'pan'; start: Point; startClient: Point; view: View; moved: boolean }
  | {
      kind: 'move'
      id: string
      start: Point
      startClient: Point
      origin: Box
      box: Box
      moved: boolean
    }
  | { kind: 'resize'; id: string; corner: Corner; origin: Box; box: Box }
  | { kind: 'pinch'; distance: number; mid: Point; view: View }

const MAX_SCALE = 6
const FIT: View = { scale: 1, x: 0, y: 0 }
/** Pointer travel, in CSS pixels, below which a press counts as a tap. */
const TAP_SLOP = 6
/** A tap that finds a box overlapping an existing one this much selects that one instead. */
const SAME_COOKIE_IOU = 0.5
/** A box added by hand is this fraction of the photo's shorter side, before zoom. */
const NEW_BOX_SIZE = 0.2
/** Keyboard nudge, as a fraction of the photo; Alt nudges finer. */
const NUDGE = 0.01
const CORNERS: Corner[] = ['nw', 'ne', 'sw', 'se']
/** Matches the menu's width (`w-56`), to keep it inside the photo's column. */
const MENU_WIDTH = 224

const percent = (n: number) => `${n * 100}%`

const TAP_HINTS: Record<TapToSelect['status'], string | null> = {
  loading: 'Getting tap-to-select ready. Taps add a box to fit meanwhile.',
  ready: null,
  unavailable: "Tap-to-select didn't load here. Tap a cookie to add a box, then fit its corners.",
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * The plate photo with a box over each cookie, and nothing around it. Tap a cookie to
 * box it: tap-to-select fits the box when it's ready, otherwise the tap adds a box there.
 * Tap a box to select it, drag it to move it, and drag its corner handles to resize it.
 * Pinch or the scroll wheel zooms, and dragging the photo pans it once zoomed in. With a
 * keyboard, Tab to Add cookie or a box: arrow keys move it, Shift + arrows resize it and
 * Delete removes it. Edits are reported once each gesture ends, so a drag is one save.
 */
export function PlateEditor({
  photo,
  cookies,
  onChange,
  label,
  tapToSelect,
  tags,
  onCreate,
  renderMenu,
  banner,
  spaceBelow = 24,
  newId = () => crypto.randomUUID(),
  className = '',
}: PlateEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<Gesture | null>(null)
  const [view, setView] = useState<View>(FIT)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [maxHeight, setMaxHeight] = useState<number | null>(null)
  // Where a tap is being looked at by tap-to-select, and what it last said.
  const [finding, setFinding] = useState<Point | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // Edits in progress, shown until the saved cookies come back as new props.
  const [draft, setDraft] = useState<{ base: readonly Cookie[]; cookies: Cookie[] } | null>(null)
  const shown = draft?.base === cookies ? draft.cookies : cookies
  const selected = shown.find((c) => c.id === selectedId) ?? null
  const menuCookie = renderMenu ? (shown.find((c) => c.id === menuId) ?? null) : null

  function commit(next: Cookie[], base: readonly Cookie[] = cookies) {
    const sorted = readingOrder(next)
    setDraft({ base, cookies: sorted })
    onChange(sorted, base)
  }

  /** Adds a cookie, selects it, and lets the page tag it or ask who baked it. */
  function add(cookie: Cookie, now: readonly Cookie[] = shown, base: readonly Cookie[] = cookies) {
    setSelectedId(cookie.id)
    setMenuId(null)
    commit([...now, cookie], base)
    if (onCreate?.(cookie)) setMenuId(cookie.id)
  }

  function openMenu(id: string) {
    setSelectedId(id)
    if (renderMenu) setMenuId(id)
  }

  async function findAt(point: Point) {
    const image = imageRef.current
    if (tapToSelect?.status !== 'ready' || !image?.complete) {
      addAt(point)
      return
    }
    setFinding(point)
    setNotice(null)
    // Let the marker paint before the model blocks the main thread.
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))
    let box: Box | null = null
    try {
      box = tapToSelect.find(image, point)
    } catch (error) {
      console.warn('Tap-to-select failed', error)
    }
    setFinding(null)
    // Props may have moved on while the model ran.
    const { shown: now, cookies: base } = latest.current
    if (!box || box.width < MIN_BOX_SIZE || box.height < MIN_BOX_SIZE) {
      addAt(point, now, base)
      setNotice("Couldn't find that cookie's edges. Drag the box's corners to fit it.")
      return
    }
    const found = box
    const existing = now.find((c) => iou(c.box, found) >= SAME_COOKIE_IOU)
    if (existing) {
      openMenu(existing.id)
      return
    }
    add({ id: newId(), box: found }, now, base)
  }

  function withBox(id: string, box: Box): Cookie[] {
    return shown.map((c) => (c.id === id ? { ...c, box } : c))
  }

  function remove(id: string) {
    setSelectedId(null)
    setMenuId(null)
    commit(shown.filter((c) => c.id !== id))
  }

  /** Converts a pointer position to normalised photo coordinates. */
  function toPhoto(client: Point): Point {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 }
    return { x: (client.x - rect.left) / rect.width, y: (client.y - rect.top) / rect.height }
  }

  /** Keeps the zoomed photo covering the viewport. */
  function clampView(next: View): View {
    const rect = viewportRef.current?.getBoundingClientRect()
    const scale = clamp(next.scale, 1, MAX_SCALE)
    if (!rect) return { ...next, scale }
    return {
      scale,
      x: clamp(next.x, rect.width * (1 - scale), 0),
      y: clamp(next.y, rect.height * (1 - scale), 0),
    }
  }

  /** Zooms by `factor`, keeping the point `at` (relative to the viewport) still. */
  function zoom(factor: number, at?: Point) {
    const rect = viewportRef.current?.getBoundingClientRect()
    const focus = at ?? { x: (rect?.width ?? 0) / 2, y: (rect?.height ?? 0) / 2 }
    setView((v) => {
      const scale = clamp(v.scale * factor, 1, MAX_SCALE)
      const k = scale / v.scale
      return clampView({
        scale,
        x: focus.x - (focus.x - v.x) * k,
        y: focus.y - (focus.y - v.y) * k,
      })
    })
  }

  function startPinch() {
    const [a, b] = [...pointers.current.values()]
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!a || !b || !rect) return
    // A second finger cancels whatever the first one started.
    setDraft(null)
    gesture.current = {
      kind: 'pinch',
      distance: Math.max(distance(a, b), 1),
      mid: { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top },
      view,
    }
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Synthetic events in tests have no real pointer to capture.
    }
    const client = { x: e.clientX, y: e.clientY }
    pointers.current.set(e.pointerId, client)
    if (pointers.current.size === 2) return startPinch()
    if (pointers.current.size > 2) return

    const target = e.target as HTMLElement
    const handle = target.closest<HTMLElement>('[data-corner]')
    const box = target.closest<HTMLElement>('[data-cookie-id]')
    const point = toPhoto(client)
    if (handle && selected) {
      e.preventDefault()
      gesture.current = {
        kind: 'resize',
        id: selected.id,
        corner: handle.dataset.corner as Corner,
        origin: selected.box,
        box: selected.box,
      }
    } else if (box?.dataset.cookieId) {
      const cookie = shown.find((c) => c.id === box.dataset.cookieId)
      if (!cookie) return
      setSelectedId(cookie.id)
      gesture.current = {
        kind: 'move',
        id: cookie.id,
        start: point,
        startClient: client,
        origin: cookie.box,
        box: cookie.box,
        moved: false,
      }
    } else {
      e.preventDefault()
      gesture.current = { kind: 'pan', start: point, startClient: client, view, moved: false }
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return
    const client = { x: e.clientX, y: e.clientY }
    pointers.current.set(e.pointerId, client)
    const g = gesture.current
    if (!g) return

    if (g.kind === 'pinch') {
      const [a, b] = [...pointers.current.values()]
      const rect = viewportRef.current?.getBoundingClientRect()
      if (!a || !b || !rect) return
      const mid = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top }
      const scale = clamp((g.view.scale * distance(a, b)) / g.distance, 1, MAX_SCALE)
      // Keep the photo point that was under the fingers' midpoint under it.
      const px = (g.mid.x - g.view.x) / g.view.scale
      const py = (g.mid.y - g.view.y) / g.view.scale
      setView(clampView({ scale, x: mid.x - px * scale, y: mid.y - py * scale }))
      return
    }

    if (g.kind === 'pan') {
      if (!g.moved && distance(client, g.startClient) < TAP_SLOP) return
      g.moved = true
      setView(
        clampView({
          scale: g.view.scale,
          x: g.view.x + client.x - g.startClient.x,
          y: g.view.y + client.y - g.startClient.y,
        }),
      )
      return
    }
    const point = toPhoto(client)
    if (g.kind === 'move') {
      if (!g.moved && distance(client, g.startClient) < TAP_SLOP) return
      g.moved = true
      g.box = moveBox(g.origin, point.x - g.start.x, point.y - g.start.y)
      setDraft({ base: cookies, cookies: withBox(g.id, g.box) })
    } else {
      // From the box as it was, so the opposite corner stays put even after a flip.
      g.box = resizeBox(g.origin, g.corner, point)
      setDraft({ base: cookies, cookies: withBox(g.id, g.box) })
    }
  }

  function onPointerEnd(e: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.delete(e.pointerId)) return
    const g = gesture.current
    if (!g) return
    if (g.kind === 'pinch') {
      // Lifting one finger ends the pinch; the other does nothing until lifted.
      if (pointers.current.size === 0) gesture.current = null
      return
    }
    gesture.current = null
    if (e.type === 'pointercancel') {
      setDraft(null)
      return
    }

    if (g.kind === 'pan') {
      if (g.moved) return
      setSelectedId(null)
      setNotice(null)
      void findAt(g.start)
    } else if (g.kind === 'resize' || g.moved) {
      commit(withBox(g.id, g.box))
    } else {
      openMenu(g.id)
    }
  }

  function onBoxKeyDown(e: KeyboardEvent<HTMLButtonElement>, cookie: Cookie) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      remove(cookie.id)
      return
    }
    const step = e.altKey ? NUDGE / 5 : NUDGE
    const delta: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }
    const d = delta[e.key]
    if (!d) return
    e.preventDefault()
    setSelectedId(cookie.id)
    const { box } = cookie
    const next = e.shiftKey
      ? resizeBox(box, 'se', { x: box.x + box.width + d.x, y: box.y + box.height + d.y })
      : moveBox(box, d.x, d.y)
    commit(withBox(cookie.id, next))
  }

  /** Adds a box, square on screen, centred on `point` for the admin to fit. */
  function addAt(point: Point, now: readonly Cookie[] = shown, base: readonly Cookie[] = cookies) {
    const side = NEW_BOX_SIZE / latest.current.view.scale
    const aspect = photo.width / photo.height
    const width = side * Math.min(1, 1 / aspect)
    const height = side * Math.min(1, aspect)
    const box = clampBox({ x: point.x - width / 2, y: point.y - height / 2, width, height })
    add({ id: newId(), box }, now, base)
  }

  function addInView() {
    // A box in the middle of what's on screen, for keyboard users.
    const rect = viewportRef.current?.getBoundingClientRect()
    addAt(
      rect
        ? toPhoto({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        : { x: 0.5, y: 0.5 },
    )
  }

  // The wheel (and a trackpad pinch, which arrives as Ctrl + wheel) zooms. React's wheel
  // listener is passive, so preventDefault needs a native one, which reads the latest
  // zoom through a ref.
  const latest = useRef({ view, zoom, shown, cookies })
  useEffect(() => {
    latest.current = { view, zoom, shown, cookies }
  })
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect()
      e.preventDefault()
      // Lines and pages (deltaMode 1 and 2) are roughly 16 and 400 pixels.
      const pixels = e.deltaY * ([1, 16, 400][e.deltaMode] ?? 1)
      latest.current.zoom(Math.exp(-pixels / (e.ctrlKey ? 100 : 400)), {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    // The menu is placed in viewport pixels, so it needs the photo's size on screen.
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => {
      el.removeEventListener('wheel', onWheel)
      observer.disconnect()
    }
  }, [])

  // The photo takes the rest of the window below it, so a laptop needn't scroll, but
  // never less than half of it: on short screens the page scrolls instead.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const update = () => {
      const top = frame.getBoundingClientRect().top + window.scrollY
      setMaxHeight(
        Math.round(Math.max(window.innerHeight - top - spaceBelow, window.innerHeight / 2)),
      )
    }
    update()
    // Rows above the photo can change height (an alert appears, tabs load).
    const observer = new ResizeObserver(update)
    observer.observe(document.body)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [spaceBelow])

  /** Below the box, or above it when it sits in the lower half of what's on screen. */
  function menuPosition(box: Box): CSSProperties {
    const left = view.x + box.x * size.width * view.scale
    const top = view.y + box.y * size.height * view.scale
    const bottom = view.y + (box.y + box.height) * size.height * view.scale
    const x = clamp(left, 0, Math.max(0, size.width - MENU_WIDTH))
    return (top + bottom) / 2 > size.height / 2
      ? { left: x, bottom: size.height - clamp(top, 0, size.height) + 4 }
      : { left: x, top: clamp(bottom, 0, size.height) + 4 }
  }

  const stageStyle = {
    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
    // Handles, numbers and outlines stay the same size on screen at any zoom.
    '--inv': 1 / view.scale,
  } as CSSProperties

  const hint = finding
    ? 'Looking for a cookie…'
    : (notice ?? (tapToSelect ? TAP_HINTS[tapToSelect.status] : null))

  return (
    <div className={className}>
      <div
        ref={frameRef}
        className="relative mx-auto"
        style={{
          width: `min(100%, calc(${maxHeight === null ? '65dvh' : `${maxHeight}px`} * ${photo.width / photo.height}))`,
        }}
      >
        <div
          ref={viewportRef}
          role="group"
          data-tap-to-select={tapToSelect?.status}
          aria-label={label}
          className="relative touch-none overflow-hidden rounded-card bg-surface-muted select-none"
          style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div ref={stageRef} className="absolute inset-0 origin-top-left" style={stageStyle}>
            <img
              ref={imageRef}
              src={photo.url}
              alt=""
              // Tap-to-select reads the pixels, so the photo must come with CORS.
              crossOrigin="anonymous"
              draggable={false}
              className="pointer-events-none size-full object-fill"
            />
            {shown.map((cookie, index) => {
              const isSelected = cookie.id === selectedId
              const tag = tags?.[cookie.id]
              const needsTag = tags !== undefined && (tag === null || tag === undefined)
              return (
                <button
                  key={cookie.id}
                  type="button"
                  data-cookie-id={cookie.id}
                  aria-label={`Cookie ${index + 1}${tag ? `, ${tag}` : needsTag ? ', needs a baker' : ''}`}
                  aria-pressed={isSelected}
                  aria-haspopup={renderMenu ? 'dialog' : undefined}
                  aria-expanded={renderMenu ? cookie.id === menuId : undefined}
                  // Keyboard clicks only (detail 0); pointer taps open the menu in onPointerEnd.
                  onClick={(e) => {
                    if (e.detail === 0) openMenu(cookie.id)
                  }}
                  aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowRight Shift+ArrowDown Delete"
                  onFocus={() => setSelectedId(cookie.id)}
                  onKeyDown={(e) => onBoxKeyDown(e, cookie)}
                  className={`absolute cursor-move rounded-[length:calc(4px*var(--inv))] border-[length:calc(3px*var(--inv))] outline-offset-[length:calc(2px*var(--inv))] ${
                    isSelected
                      ? 'z-10 border-snow'
                      : needsTag
                        ? 'border-dashed border-warning'
                        : 'border-accent'
                  }`}
                  style={{
                    left: percent(cookie.box.x),
                    top: percent(cookie.box.y),
                    width: percent(cookie.box.width),
                    height: percent(cookie.box.height),
                    boxShadow: '0 0 0 calc(1px * var(--inv)) var(--color-ink)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-0 left-0 grid size-7 origin-top-left scale-(--inv) place-items-center rounded-br-control font-display text-sm font-bold ${
                      isSelected ? 'bg-snow text-ink' : 'bg-accent text-on-accent'
                    }`}
                  >
                    {index + 1}
                  </span>
                  {tags && (
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0 left-0 origin-bottom-left scale-(--inv) rounded-tr-control px-1.5 text-sm font-bold whitespace-nowrap ${
                        isSelected
                          ? 'bg-snow text-ink'
                          : needsTag
                            ? 'bg-warning-subtle text-on-warning-subtle'
                            : 'bg-accent text-on-accent'
                      }`}
                    >
                      {tag ?? 'Who baked this?'}
                    </span>
                  )}
                </button>
              )
            })}
            {selected &&
              CORNERS.map((corner) => (
                <div
                  key={corner}
                  data-corner={corner}
                  aria-hidden="true"
                  className="absolute z-20 grid size-11 -translate-1/2 scale-(--inv) place-items-center"
                  style={{
                    left: percent(selected.box.x + (corner.endsWith('e') ? selected.box.width : 0)),
                    top: percent(
                      selected.box.y + (corner.startsWith('s') ? selected.box.height : 0),
                    ),
                    cursor: corner === 'ne' || corner === 'sw' ? 'nesw-resize' : 'nwse-resize',
                  }}
                >
                  <span className="size-4 rounded-full border-2 border-primary bg-snow shadow-card" />
                </div>
              ))}
            {finding && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute size-6 -translate-1/2 scale-(--inv) rounded-full motion-safe:animate-ping border-4 border-snow bg-primary"
                style={{ left: percent(finding.x), top: percent(finding.y) }}
              />
            )}
          </div>
        </div>
        {banner && (
          <div className="pointer-events-none absolute inset-x-2 top-2 z-20 flex justify-center">
            {banner}
          </div>
        )}
        {/* Over the photo, so hints cost no height; screen readers hear each change. */}
        <p
          aria-live="polite"
          className={`pointer-events-none absolute inset-x-2 bottom-2 flex ${hint ? '' : 'sr-only'}`}
        >
          {hint && (
            <span className="flex items-center gap-2 rounded-control bg-surface/90 px-2 py-1 text-sm text-ink shadow-card">
              {(finding || (!notice && tapToSelect?.status === 'loading')) && (
                <Spinner size="sm" label="" />
              )}
              {hint}
            </span>
          )}
        </p>
        {/* Only shows when focused: a keyboard way to add a box in the middle of the view. */}
        <Button
          variant="secondary"
          onClick={addInView}
          className="absolute top-2 right-2 z-30 not-focus-visible:sr-only"
        >
          Add cookie
        </Button>
        {menuCookie && (
          <div className="absolute z-30" style={menuPosition(menuCookie.box)}>
            {renderMenu?.(menuCookie, {
              number: shown.indexOf(menuCookie) + 1,
              close: () => setMenuId(null),
              remove: () => remove(menuCookie.id),
            })}
          </div>
        )}
      </div>
    </div>
  )
}
