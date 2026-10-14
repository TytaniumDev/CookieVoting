import {
  boxFromPoints,
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
  /** Tapping a cookie boxes it when this is ready; without it, boxes are drawn by hand. */
  tapToSelect?: TapToSelect
  /**
   * A name tag for each cookie by id (its baker); null marks a cookie that still needs
   * one. Without it, boxes show only their numbers.
   */
  tags?: Readonly<Record<string, string | null>>
  /**
   * Called when a cookie is added (by a tap, a drawn box or Add cookie), after
   * `onChange`. Return true to open its menu straight away.
   */
  onCreate?: (cookie: Cookie) => boolean | void
  /** With this, tapping a box (or Enter on it) opens this menu next to it. */
  renderMenu?: (cookie: Cookie, actions: MenuActions) => ReactNode
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
  | { kind: 'draw'; start: Point; startClient: Point; current: Point }
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
/** Keyboard nudge, as a fraction of the photo; Alt nudges finer. */
const NUDGE = 0.01
const CORNERS: Corner[] = ['nw', 'ne', 'sw', 'se']
/** Matches the menu's width (`w-56`), to keep it inside the photo's column. */
const MENU_WIDTH = 224

const percent = (n: number) => `${n * 100}%`

const TAP_HINTS: Record<TapToSelect['status'], string> = {
  loading: 'Getting tap-to-select ready. You can drag to draw boxes meanwhile.',
  ready: 'Tap a cookie to box it, or drag to draw a box.',
  unavailable: "Tap-to-select didn't load on this device, so drag across each cookie to box it.",
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * The plate photo with a box over each cookie. Tap a cookie to box it (when
 * `tapToSelect` is ready) or drag on the photo to draw a box; tap a box to select it, drag it to move it, and drag its corner handles to resize it.
 * Pinch (or Ctrl + scroll) zooms and two fingers pan. With a keyboard, Tab to a box,
 * use the arrow keys to move it, Shift + arrows to resize it and Delete to remove it.
 * Edits are reported once each gesture ends, so a drag is one save.
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
  newId = () => crypto.randomUUID(),
  className = '',
}: PlateEditorProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<Gesture | null>(null)
  const [view, setView] = useState<View>(FIT)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [drawing, setDrawing] = useState<Box | null>(null)
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
    if (tapToSelect?.status !== 'ready' || !image?.complete) return
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
      setNotice("Couldn't find a cookie there. Tap its middle, or drag to draw a box.")
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
    setDrawing(null)
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
      gesture.current = { kind: 'draw', start: point, startClient: client, current: point }
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

    const point = toPhoto(client)
    if (g.kind === 'draw') {
      g.current = point
      if (distance(client, g.startClient) >= TAP_SLOP) setDrawing(boxFromPoints(g.start, point))
    } else if (g.kind === 'move') {
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
      setDrawing(null)
      return
    }

    if (g.kind === 'draw') {
      setDrawing(null)
      const box = boxFromPoints(g.start, g.current)
      if (box.width >= MIN_BOX_SIZE && box.height >= MIN_BOX_SIZE) {
        add({ id: newId(), box })
      } else {
        setSelectedId(null)
        if (distance({ x: e.clientX, y: e.clientY }, g.startClient) < TAP_SLOP) void findAt(g.start)
      }
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

  function addInView() {
    // A box in the middle of what's on screen, for keyboard users and big fingers.
    const rect = viewportRef.current?.getBoundingClientRect()
    const centre = rect
      ? toPhoto({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      : { x: 0.5, y: 0.5 }
    const side = 0.15 / view.scale
    add({
      id: newId(),
      box: clampBox({
        x: centre.x - side / 2,
        y: centre.y - side / 2,
        width: side,
        height: side,
      }),
    })
  }

  // Ctrl + wheel (and trackpad pinch) zooms; plain wheel pans once zoomed in, and
  // scrolls the page otherwise. React's wheel listener is passive, so preventDefault
  // needs a native one, which reads the latest view and zoom through refs.
  const latest = useRef({ view, zoom, shown, cookies })
  useEffect(() => {
    latest.current = { view, zoom, shown, cookies }
  })
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect()
      const { view: v, zoom: zoomBy } = latest.current
      if (e.ctrlKey) {
        e.preventDefault()
        zoomBy(Math.exp(-e.deltaY / 200), { x: e.clientX - rect.left, y: e.clientY - rect.top })
      } else if (v.scale > 1) {
        e.preventDefault()
        setView({
          scale: v.scale,
          x: clamp(v.x - e.deltaX, rect.width * (1 - v.scale), 0),
          y: clamp(v.y - e.deltaY, rect.height * (1 - v.scale), 0),
        })
      }
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

  return (
    <div className={`space-y-3 ${className}`}>
      {tapToSelect && (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          {tapToSelect.status === 'loading' && <Spinner size="sm" label="" />}
          {TAP_HINTS[tapToSelect.status]}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={() => zoom(1 / 1.5)} disabled={view.scale <= 1}>
          <span aria-hidden="true" className="text-2xl">
            −
          </span>
          <span className="sr-only">Zoom out</span>
        </Button>
        <Button variant="ghost" onClick={() => zoom(1.5)} disabled={view.scale >= MAX_SCALE}>
          <span aria-hidden="true" className="text-2xl">
            +
          </span>
          <span className="sr-only">Zoom in</span>
        </Button>
        <Button variant="ghost" onClick={() => setView(FIT)} disabled={view.scale === 1}>
          Fit
        </Button>
        <span className="flex-1" />
        <Button variant="secondary" onClick={addInView}>
          Add cookie
        </Button>
      </div>

      <div
        className="relative mx-auto"
        style={{ width: `min(100%, calc(65dvh * ${photo.width / photo.height}))` }}
      >
        <div
          ref={viewportRef}
          role="group"
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
            {drawing && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute rounded-[length:calc(4px*var(--inv))] border-[length:calc(3px*var(--inv))] border-dashed border-snow"
                style={{
                  left: percent(drawing.x),
                  top: percent(drawing.y),
                  width: percent(drawing.width),
                  height: percent(drawing.height),
                  boxShadow: '0 0 0 calc(1px * var(--inv)) var(--color-ink)',
                }}
              />
            )}
            {finding && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute size-6 -translate-1/2 scale-(--inv) rounded-full motion-safe:animate-ping border-4 border-snow bg-primary"
                style={{ left: percent(finding.x), top: percent(finding.y) }}
              />
            )}
          </div>
        </div>
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

      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 text-ink-muted" aria-live="polite">
          {finding
            ? 'Looking for a cookie…'
            : (notice ??
              `${shown.length === 1 ? '1 cookie' : `${shown.length} cookies`}${
                selected ? `, cookie ${shown.indexOf(selected) + 1} selected` : ''
              }`)}
        </p>
        {selected && (
          <Button variant="danger" onClick={() => remove(selected.id)}>
            Delete cookie {shown.indexOf(selected) + 1}
          </Button>
        )}
      </div>
    </div>
  )
}
