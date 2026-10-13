import type { Cookie } from '@cookie-voting/shared'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test'
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
      onChange={(next) => {
        props.onChange(next)
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
    await expect(canvas.getByText('4 cookies')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { cookies: [] },
}

export const DrawACookie: Story = {
  args: { cookies: [] },
  play: async ({ args, canvas }) => {
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    drag(plate, { x: 0.1, y: 0.1 }, { x: 0.4, y: 0.45 })
    await expect(await canvas.findByRole('button', { name: 'Cookie 1' })).toBeVisible()
    await expect(canvas.getByText(/1 cookie, cookie 1 selected/)).toBeVisible()
    const [cookies] = (args.onChange as ReturnType<typeof fn>).mock.lastCall as [Cookie[]]
    await expect(cookies[0]?.box.x).toBeCloseTo(0.1, 2)
    await expect(cookies[0]?.box.width).toBeCloseTo(0.3, 2)
  },
}

/** A tap without dragging doesn't make a tiny cookie. */
export const TapDoesNotDraw: Story = {
  args: { cookies: [] },
  play: async ({ args, canvas }) => {
    const plate = canvas.getByRole('group', { name: 'Stars plate' })
    drag(plate, { x: 0.5, y: 0.5 }, { x: 0.501, y: 0.501 })
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(canvas.getByText('0 cookies')).toBeVisible()
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

export const DeleteWithButton: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Cookie 2' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Delete cookie 2' }))
    await expect(canvas.getByText('3 cookies')).toBeVisible()
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
    await expect(canvas.getByText('3 cookies')).toBeVisible()
  },
}

export const AddWithButton: Story = {
  args: { cookies: [] },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add cookie' }))
    await expect(canvas.getByRole('button', { name: 'Cookie 1' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Delete cookie 1' })).toBeVisible()
  },
}

export const Zoom: Story = {
  play: async ({ canvas, canvasElement }) => {
    const fit = canvas.getByRole('button', { name: 'Fit' })
    await expect(fit).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom in' }))
    await expect(fit).toBeEnabled()
    const stage = within(canvasElement).getByRole('group').firstElementChild as HTMLElement
    await expect(stage.style.transform).toContain('scale(1.5)')
    await userEvent.click(fit)
    await expect(stage.style.transform).toContain('scale(1)')
  },
}
