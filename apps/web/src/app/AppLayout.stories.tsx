import type { Meta, StoryObj } from '@storybook/react-vite'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { expect } from 'storybook/test'
import { AppBarTitle } from './AppBarSlot.tsx'
import { AppLayout } from './AppLayout.tsx'
import { ReadableLayout } from './ReadableLayout.tsx'

function SetupPage() {
  return (
    <>
      <AppBarTitle pageHeading>Christmas Cookie Bake-Off</AppBarTitle>
      <p>An admin page: the event's name is its heading, in the app bar.</p>
    </>
  )
}

function VoterPage() {
  return (
    <>
      <AppBarTitle>Christmas Cookie Bake-Off</AppBarTitle>
      <p>A voter page: the event's name in the app bar, hidden on phones.</p>
    </>
  )
}

function Layout({ path }: { path: string }) {
  const router = createMemoryRouter(
    [
      {
        Component: AppLayout,
        children: [
          { path: '/admin', Component: SetupPage },
          { Component: ReadableLayout, children: [{ path: '/event', Component: VoterPage }] },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  return <RouterProvider router={router} />
}

/** Where `el`'s first line of text sits: a zero-size inline block rests on the baseline. */
function baseline(el: Element) {
  const probe = document.createElement('span')
  probe.style.cssText = 'display:inline-block;width:0;height:0'
  el.append(probe)
  const y = probe.getBoundingClientRect().bottom
  probe.remove()
  return y
}

const meta = {
  component: Layout,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Layout>

export default meta
type Story = StoryObj<typeof meta>

export const AdminPageTitle: Story = {
  args: { path: '/admin' },
  play: async ({ canvas }) => {
    const title = await canvas.findByRole('heading', { level: 1, name: /bake-off/i })
    const home = canvas.getByRole('link', { name: /cookie voting/i })
    // The page's title sits level with "Cookie Voting", not centred on its bigger box.
    await expect(Math.abs(baseline(title) - baseline(home))).toBeLessThan(1)
  },
}

export const VoterPageTitle: Story = { args: { path: '/event' } }
