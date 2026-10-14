import type { Cookie } from '@cookie-voting/shared'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test'
import { BakerMenu } from '../BakerMenu/BakerMenu.tsx'
import { PlateEditor, type PlateEditorProps } from './PlateEditor.tsx'

const photo = { url: '/plates/4-cookies_stars.jpg', width: 2048, height: 1536 }

const stars: Cookie[] = [
  { id: 'a', box: { x: 0.08, y: 0.1, width: 0.3, height: 0.36 } },
  { id: 'b', box: { x: 0.55, y: 0.08, width: 0.3, height: 0.38 } },
  { id: 'c', box: { x: 0.1, y: 0.55, width: 0.3, height: 0.36 } },
  { id: 'd', box: { x: 0.56, y: 0.54, width: 0.3, height: 0.38 } },
]

/** Keeps edits, like the real page does via Firestore. */
function Editable(props: PlateEditorProps) {
  const [cookies, setCookies] = useState(props.cookies)
  return (
    <PlateEditor
      {...props}
      cookies={cookies}
      onChange={(next, base) => {
        props.onChange(next, base)
        setCookies(next)
      }}
    />
  )
}

let nextId = 0

const meta = {
  component: PlateEditor,
  parameters: { layout: 'padded' },
  args: {
    photo,
    cookies: stars,
    onChange: fn(),
    label: 'Stars plate',
    newId: () => `new-${++nextId}`,
  },
  render: (args) => <Editable {...args} />,
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlateEditor>

export default meta
type Story = StoryObj<typeof meta>

/** Drags a pointer across the photo between two points given as fractions of its size. */
function drag(
  el: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  target: Element = el,
) {
  const rect = el.getBoundingClientRect()
  const at = (p: { x: number; y: number }) => ({
    clientX: rect.left + p.x * rect.width,
    clientY: rect.top + p.y * rect.height,
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    bubbles: true,
  })
  fireEvent.pointerDown(target, at(from))
  fireEvent.pointerMove(el, at({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }))
  fireEvent.pointerMove(el, at(to))
  fireEvent.pointerUp(el, at(to))
}

export const WithCookies: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('button', { name: /^cookie \d$/i })).toHaveLength(4)
  },
}

export const Empty: Story = {
  args: { cookies: [] },
}

/** Without tap-to-select, a tap adds a box centred on it, square on screen, to fit by hand. */
export const TapAddsABox: Story = {
  args: { cookies: [] },
  play: async ({ args, canvas }) => {
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    drag(plate, { x: 0.3, y: 0.3 }, { x: 0.301, y: 0.301 })
    await expect(await canvas.findByRole('button', { name: 'Cookie 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const [cookies] = (args.onChange as ReturnType<typeof fn>).mock.lastCall as [Cookie[]]
    // The photo is 4:3, so a square box is 0.15 of its width and 0.2 of its height.
    await expect(cookies[0]?.box.width).toBeCloseTo(0.15, 3)
    await expect(cookies[0]?.box.height).toBeCloseTo(0.2, 3)
    await expect(cookies[0]?.box.x).toBeCloseTo(0.225, 3)
  },
}

/** Dragging the photo pans it (once zoomed in) and never adds a box. */
export const DragDoesNotAdd: Story = {
  args: { cookies: [] },
  play: async ({ args, canvas }) => {
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    drag(plate, { x: 0.1, y: 0.1 }, { x: 0.4, y: 0.45 })
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}

export const MoveACookie: Story = {
  play: async ({ args, canvas }) => {
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    drag(
      plate,
      { x: 0.2, y: 0.25 },
      { x: 0.25, y: 0.3 },
      canvas.getByRole('button', { name: 'Cookie 1' }),
    )
    await waitFor(() => expect(args.onChange).toHaveBeenCalledTimes(1))
    const [cookies] = (args.onChange as ReturnType<typeof fn>).mock.lastCall as [Cookie[]]
    await expect(cookies[0]?.box.x).toBeCloseTo(0.13, 2)
    await expect(cookies[0]?.box.y).toBeCloseTo(0.15, 2)
  },
}

export const ResizeACookie: Story = {
  play: async ({ args, canvas, canvasElement }) => {
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    await userEvent.click(canvas.getByRole('button', { name: 'Cookie 4' }))
    const handle = canvasElement.querySelector('[data-corner="se"]')
    if (!handle) throw new Error('No resize handle')
    drag(plate, { x: 0.86, y: 0.92 }, { x: 0.96, y: 0.97 }, handle)
    await waitFor(() => expect(args.onChange).toHaveBeenCalled())
    const [cookies] = (args.onChange as ReturnType<typeof fn>).mock.lastCall as [Cookie[]]
    await expect(cookies[3]?.box.x).toBeCloseTo(0.56, 2)
    await expect(cookies[3]?.box.width).toBeCloseTo(0.4, 2)
  },
}

export const Keyboard: Story = {
  play: async ({ args, canvas }) => {
    canvas.getByRole('button', { name: 'Cookie 1' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    let [cookies] = (args.onChange as ReturnType<typeof fn>).mock.lastCall as [Cookie[]]
    await expect(cookies[0]?.box.x).toBeCloseTo(0.09, 3)
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
    ;[cookies] = (args.onChange as ReturnType<typeof fn>).mock.lastCall as [Cookie[]]
    await expect(cookies[0]?.box.height).toBeCloseTo(0.37, 3)
    await userEvent.keyboard('{Delete}')
    await expect(canvas.getAllByRole('button', { name: /^cookie \d$/i })).toHaveLength(3)
  },
}

/** Add cookie only shows when focused: the keyboard way to add a box. */
export const AddFromKeyboard: Story = {
  args: { cookies: [] },
  play: async ({ canvas }) => {
    await userEvent.tab()
    const add = canvas.getByRole('button', { name: 'Add cookie' })
    await expect(add).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('button', { name: 'Cookie 1' })).toBeVisible()
  },
}

/** The scroll wheel zooms in on the pointer and back out to fit. */
export const Zoom: Story = {
  play: async ({ canvas }) => {
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    const stage = plate.firstElementChild as HTMLElement
    const rect = plate.getBoundingClientRect()
    const at = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
    fireEvent.wheel(plate, { ...at, deltaY: -400 })
    await waitFor(() => expect(stage.style.transform).toMatch(/scale\(2\.7/))
    fireEvent.wheel(plate, { ...at, deltaY: 2000 })
    await waitFor(() => expect(stage.style.transform).toContain('scale(1)'))
  },
}

/** A prompt floats at the top of the photo without blocking taps on cookies under it. */
export const WithBanner: Story = {
  args: {
    banner: (
      <p className="rounded-full bg-primary px-4 py-1.5 font-bold text-on-primary shadow-raised">
        Tap Ben’s cookie
      </p>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Tap Ben’s cookie')).toBeVisible()
  },
}

/** Stands in for the model: "finds" a 20% box centred on the tap. */
const fakeFind = (_photo: HTMLImageElement, point: { x: number; y: number }) => ({
  x: point.x - 0.1,
  y: point.y - 0.1,
  width: 0.2,
  height: 0.2,
})

/** Waits for the photo, since tap-to-select only runs on a loaded image. */
async function photoLoaded(canvasElement: HTMLElement) {
  const img = canvasElement.querySelector('img')
  await waitFor(() => expect(img?.complete && img.naturalWidth > 0).toBe(true))
}

export const TapToSelectLoading: Story = {
  args: { cookies: [], tapToSelect: { status: 'loading' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/getting tap-to-select ready/i)).toBeVisible()
  },
}

export const TapToSelectUnavailable: Story = {
  args: { cookies: [], tapToSelect: { status: 'unavailable' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/tap a cookie to add a box/i)).toBeVisible()
  },
}

export const TapACookie: Story = {
  args: { cookies: [], tapToSelect: { status: 'ready', find: fakeFind } },
  play: async ({ args, canvas, canvasElement }) => {
    await photoLoaded(canvasElement)
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    drag(plate, { x: 0.3, y: 0.3 }, { x: 0.3, y: 0.3 })
    await expect(await canvas.findByRole('button', { name: 'Cookie 1' })).toBeVisible()
    const [cookies] = (args.onChange as ReturnType<typeof fn>).mock.lastCall as [Cookie[]]
    await expect(cookies[0]?.box.x).toBeCloseTo(0.2, 2)
    await expect(cookies[0]?.box.width).toBeCloseTo(0.2, 2)
  },
}

/** Tapping a cookie that's already boxed selects it rather than adding a duplicate. */
export const TapAnExistingCookie: Story = {
  args: {
    cookies: [{ id: 'a', box: { x: 0.2, y: 0.2, width: 0.2, height: 0.2 } }],
    // The model finds nearly the same box as one that's already there.
    tapToSelect: {
      status: 'ready',
      find: () => ({ x: 0.21, y: 0.2, width: 0.2, height: 0.21 }),
    },
  },
  play: async ({ args, canvas, canvasElement }) => {
    await photoLoaded(canvasElement)
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    drag(plate, { x: 0.7, y: 0.7 }, { x: 0.7, y: 0.7 })
    const cookie = canvas.getByRole('button', { name: 'Cookie 1' })
    await waitFor(() => expect(cookie).toHaveAttribute('aria-pressed', 'true'))
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}

/** When tap-to-select finds nothing, the tap still adds a box, to fit by hand. */
export const TapFindsNothing: Story = {
  args: { cookies: [], tapToSelect: { status: 'ready', find: () => null } },
  play: async ({ args, canvas, canvasElement }) => {
    await photoLoaded(canvasElement)
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    drag(plate, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 })
    await expect(await canvas.findByText(/couldn't find that cookie's edges/i)).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Cookie 1' })).toBeVisible()
    await expect(args.onChange).toHaveBeenCalledTimes(1)
  },
}

const roster = ['Alice', 'Ben', 'Carmen', 'Dev'].map((name) => ({ id: name.toLowerCase(), name }))

/** Tags each box with its baker, like the Cookies step does; one still needs a baker. */
function Tagging(props: PlateEditorProps & { initialTags: Record<string, string> }) {
  const [cookies, setCookies] = useState(props.cookies)
  const [tags, setTags] = useState(props.initialTags)
  const name = (id: string | undefined) => roster.find((b) => b.id === id)?.name ?? null
  const next = roster.find((b) => !cookies.some((c) => tags[c.id] === b.id))
  return (
    <PlateEditor
      {...props}
      cookies={cookies}
      tags={Object.fromEntries(cookies.map((c) => [c.id, name(tags[c.id])]))}
      onChange={(nextCookies, base) => {
        props.onChange(nextCookies, base)
        setCookies(nextCookies)
      }}
      onCreate={(cookie) => {
        if (!next) return true
        setTags((t) => ({ ...t, [cookie.id]: next.id }))
      }}
      renderMenu={(cookie, { number, close, remove }) => (
        <BakerMenu
          title={`Cookie ${number}`}
          bakers={roster}
          value={tags[cookie.id] ?? null}
          onChange={(id) => {
            setTags((t) => ({ ...t, [cookie.id]: id }))
            close()
          }}
          onDelete={remove}
          onClose={close}
        />
      )}
    />
  )
}

export const Tagged: Story = {
  render: (args) => <Tagging {...args} initialTags={{ a: 'alice', b: 'ben', c: 'carmen' }} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Cookie 1, Alice' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Cookie 4, needs a baker' })).toBeVisible()
  },
}

/** A new box is tagged with whoever is next. */
export const NewCookieIsTagged: Story = {
  args: { cookies: [] },
  render: (args) => <Tagging {...args} initialTags={{}} />,
  play: async ({ canvas }) => {
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    drag(plate, { x: 0.25, y: 0.3 }, { x: 0.25, y: 0.3 })
    await expect(await canvas.findByRole('button', { name: 'Cookie 1, Alice' })).toBeVisible()
  },
}

/** Tapping a tagged box opens the baker menu with its baker marked; picking another retags it. */
export const Reassign: Story = {
  render: (args) => <Tagging {...args} initialTags={{ a: 'alice', b: 'ben', c: 'carmen' }} />,
  play: async ({ canvas }) => {
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    drag(
      plate,
      { x: 0.7, y: 0.25 },
      { x: 0.7, y: 0.25 },
      canvas.getByRole('button', { name: 'Cookie 2, Ben' }),
    )
    const menu = await canvas.findByRole('dialog', { name: 'Who baked cookie 2?' })
    await expect(within(menu).getByRole('button', { name: 'Ben' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(within(menu).getByRole('button', { name: 'Dev' }))
    await expect(canvas.getByRole('button', { name: 'Cookie 2, Dev' })).toBeVisible()
    await expect(canvas.queryByRole('dialog')).toBeNull()
  },
}

/** With everyone tagged, a new cookie opens the menu so the admin picks its baker. */
export const ExtraCookieAsks: Story = {
  render: (args) => (
    <Tagging {...args} initialTags={{ a: 'alice', b: 'ben', c: 'carmen', d: 'dev' }} />
  ),
  play: async ({ canvas }) => {
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    drag(plate, { x: 0.47, y: 0.5 }, { x: 0.47, y: 0.5 })
    const menu = await canvas.findByRole('dialog', { name: /^who baked cookie \d\?$/i })
    await expect(within(menu).getByRole('button', { name: 'Alice' })).toHaveFocus()
    await userEvent.click(within(menu).getByRole('button', { name: /^delete cookie \d$/i }))
    await expect(canvas.getAllByRole('button', { name: /^cookie \d/i })).toHaveLength(4)
  },
}

/** Enter on a focused box opens its menu too. */
export const MenuFromKeyboard: Story = {
  render: (args) => <Tagging {...args} initialTags={{ a: 'alice' }} />,
  play: async ({ canvas }) => {
    canvas.getByRole('button', { name: 'Cookie 1, Alice' }).focus()
    await userEvent.keyboard('{Enter}')
    await expect(await canvas.findByRole('dialog', { name: 'Who baked cookie 1?' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect(canvas.queryByRole('dialog')).toBeNull()
  },
}
