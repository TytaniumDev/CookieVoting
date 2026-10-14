import { iou, type Box } from '@cookie-voting/shared'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { addCategory, expectCategoryNames, nameCategory } from './categories.ts'
import { reloadWhenSaved } from './reload.ts'
import { signInAs } from './signIn.ts'

test('people who are not admins are turned away', async ({ page }) => {
  await signInAs(page, 'grinch@example.com')
  await expect(page.getByText('Not on the admin list')).toBeVisible()
  await page.getByRole('button', { name: /sign out/i }).click()
  await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
})

test('an admin creates an event and manages its bakers', async ({ page }, testInfo) => {
  const eventName = `E2E Bake-Off ${testInfo.project.name} ${Date.now()}`
  const newBaker = `Zed ${testInfo.project.name} ${Date.now()}`

  await signInAs(page, 'admin@example.com')
  await expect(page.getByRole('heading', { name: 'Your events' })).toBeVisible()
  await expect(page.getByRole('link', { name: /christmas cookie bake-off 2025/i })).toBeVisible()

  await page.getByRole('link', { name: 'New event' }).click()
  await page.getByLabel('Event name').fill(eventName)
  await page.getByRole('button', { name: 'Create event' }).click()

  await expect(page.getByRole('heading', { name: eventName })).toBeVisible()
  await expect(page.getByRole('button', { name: /^bakers/i })).toHaveAttribute(
    'aria-current',
    'step',
  )

  // Add an existing baker from the global list.
  await page.getByLabel('Name').fill('ann')
  await page.getByRole('button', { name: 'Add Ann' }).click()
  await expect(page.getByRole('button', { name: 'Remove Ann' })).toBeVisible()

  // Create a brand-new baker.
  await page.getByLabel('Name').fill(newBaker)
  await page.getByRole('button', { name: `Create “${newBaker}”` }).click()
  await expect(page.getByRole('button', { name: `Remove ${newBaker}` })).toBeVisible()

  // Remove one from the event.
  await page.getByRole('button', { name: 'Remove Ann' }).click()
  await expect(page.getByRole('button', { name: 'Remove Ann' })).toBeHidden()

  // The dashboard shows the next step.
  await page.getByRole('link', { name: /all events/i }).click()
  await expect(page.getByRole('link', { name: new RegExp(eventName) })).toContainText(
    'Next: Categories',
  )
})

test('an admin adds categories with plate photos', async ({ page }, testInfo) => {
  const eventName = `E2E Categories ${testInfo.project.name} ${Date.now()}`
  await signInAs(page, 'admin@example.com')
  await page.getByRole('link', { name: 'New event' }).click()
  await page.getByLabel('Event name').fill(eventName)
  await page.getByRole('button', { name: 'Create event' }).click()
  await page.getByRole('button', { name: /^categories/i }).click()
  // The steps stay in one row: it fits on a desktop and scrolls sideways on phones,
  // without the page itself scrolling.
  const stepper = page.getByRole('navigation', { name: 'Setup steps' })
  const first = (await stepper.getByRole('button').first().boundingBox())!
  const last = (await stepper.getByRole('button').last().boundingBox())!
  const row = (await stepper.boundingBox())!
  expect(last.y).toBe(first.y)
  expect(last.x + last.width <= row.x + row.width).toBe(testInfo.project.name === 'desktop')
  expect(await page.evaluate('document.documentElement.scrollWidth')).toBeLessThanOrEqual(
    page.viewportSize()?.width ?? 0,
  )

  // Upload two real 12 MP phone photos; each is shrunk, stored and becomes a plate.
  await page
    .getByLabel('Upload plate photos')
    .setInputFiles([
      '../../fixtures/plates/5-cookies_PXL_20251215_000827596.jpg',
      '../../fixtures/plates/5-cookies_candy-canes.jpg',
    ])
  await expectCategoryNames(page, ['Plate 1', 'Plate 2'])

  // Name them; each name saves itself and survives a reload.
  await nameCategory(page, 0, 'Thumbprints')
  await nameCategory(page, 1, 'Candy Canes')
  await reloadWhenSaved(page)
  await expectCategoryNames(page, ['Thumbprints', 'Candy Canes'])

  // Reorder with the keyboard: lift Candy Canes, move it up, drop.
  // dnd-kit announces each step in a live region; wait for it so keys aren't dropped.
  const announcer = page.locator('[id^="DndLiveRegion"]')
  await page.getByRole('button', { name: 'Reorder Candy Canes' }).focus()
  await page.keyboard.press('Space')
  await expect(announcer).toContainText('Candy Canes moved to position 2')
  // Phones show one column of cards; wider screens put them side by side.
  await page.keyboard.press(testInfo.project.name === 'mobile' ? 'ArrowUp' : 'ArrowLeft')
  await expect(announcer).toContainText('Candy Canes moved to position 1')
  await page.keyboard.press('Space')
  await expect(announcer).toContainText('Candy Canes dropped at position 1')
  await expectCategoryNames(page, ['Candy Canes', 'Thumbprints'])
  await reloadWhenSaved(page)
  await expectCategoryNames(page, ['Candy Canes', 'Thumbprints'])

  // Delete asks first.
  await page.getByRole('button', { name: 'Delete Candy Canes' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expectCategoryNames(page, ['Thumbprints'])
})

type Point = [number, number]

/** Taps a plate photo at a point given as fractions of its size. */
async function tapOn(page: Page, plate: Locator, [x, y]: Point) {
  const box = await plate.boundingBox()
  if (!box) throw new Error('Plate not visible')
  await page.mouse.click(box.x + x * box.width, box.y + y * box.height)
}

/** Drags from the middle of an element by (dx, dy) pixels. */
async function dragBy(page: Page, target: Locator, dx: number, dy: number) {
  const box = await target.boundingBox()
  if (!box) throw new Error('Not visible')
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2]
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + dx, y + dy, { steps: 5 })
  await page.mouse.up()
}

test('an admin boxes the cookies on a plate', async ({ page }, testInfo) => {
  const eventName = `E2E Cookies ${testInfo.project.name} ${Date.now()}`
  await signInAs(page, 'admin@example.com')
  await page.getByRole('link', { name: 'New event' }).click()
  await page.getByLabel('Event name').fill(eventName)
  await page.getByRole('button', { name: 'Create event' }).click()
  await page.getByRole('button', { name: /^categories/i }).click()
  await addCategory(page, 'Stars', '4-cookies_stars.jpg')

  await page.getByRole('button', { name: /^cookies/i }).click()
  const plate = page.getByRole('group', { name: 'Stars plate' })
  await expect(plate.locator('img')).toHaveJSProperty('complete', true)
  await plate.scrollIntoViewIfNeeded()
  const boxes = plate.getByRole('button', { name: /^cookie \d$/i })

  // Tap two cookies: each gets a box, whether or not tap-to-select has loaded.
  await tapOn(page, plate, [0.23, 0.28])
  await expect(boxes).toHaveCount(1, { timeout: 15_000 })
  await tapOn(page, plate, [0.71, 0.73])
  await expect(boxes).toHaveCount(2, { timeout: 15_000 })

  // Grow the new box (selected) from its bottom-right corner.
  const second = plate.getByRole('button', { name: 'Cookie 2' })
  const before = (await second.boundingBox())?.width ?? 0
  await dragBy(page, plate.locator('[data-corner="se"]'), 40, 30)
  await expect.poll(async () => (await second.boundingBox())?.width).toBeGreaterThan(before + 20)

  // Saved: still there after a reload.
  await reloadWhenSaved(page)
  await expect(boxes).toHaveCount(2)

  // Delete one from the keyboard (with bakers, the box's menu has Delete too).
  await plate.getByRole('button', { name: 'Cookie 1' }).focus()
  await page.keyboard.press('Delete')
  await expect(boxes).toHaveCount(1)
  expect(await page.evaluate('document.documentElement.scrollWidth')).toBeLessThanOrEqual(
    page.viewportSize()?.width ?? 0,
  )
})

test('tapping each cookie boxes it', async ({ page }, testInfo) => {
  test.slow() // Downloads and runs the segmentation model.
  const photo = '5-cookies_candy-canes'
  const truth = JSON.parse(
    await readFile(new URL(`../../../fixtures/plates/${photo}.json`, import.meta.url), 'utf8'),
  ) as { cookies: { box: Box }[] }

  await signInAs(page, 'admin@example.com')
  await page.getByRole('link', { name: 'New event' }).click()
  await page.getByLabel('Event name').fill(`E2E Tap ${testInfo.project.name} ${Date.now()}`)
  await page.getByRole('button', { name: 'Create event' }).click()
  await page.getByRole('button', { name: /^categories/i }).click()
  await addCategory(page, 'Candy Canes', `${photo}.jpg`)

  await page.getByRole('button', { name: /^cookies/i }).click()
  const plate = page.getByRole('group', { name: 'Candy Canes plate' })
  await expect(plate).toHaveAttribute('data-tap-to-select', 'ready', { timeout: 60_000 })
  await expect(plate.locator('img')).toHaveJSProperty('complete', true)
  await plate.scrollIntoViewIfNeeded()

  // Tap the middle of each cookie, as an admin would.
  for (const [i, { box }] of truth.cookies.entries()) {
    const rect = (await plate.boundingBox())!
    await page.mouse.click(
      rect.x + (box.x + box.width / 2) * rect.width,
      rect.y + (box.y + box.height / 2) * rect.height,
    )
    await expect(plate.getByRole('button', { name: /^cookie \d$/i })).toHaveCount(i + 1, {
      timeout: 15_000,
    })
  }

  // Each found box matches the hand-labelled one (ARCHITECTURE.md → Tap-to-select).
  const rect = (await plate.boundingBox())!
  const found = await Promise.all(
    (await plate.getByRole('button', { name: /^cookie \d$/i }).all()).map(async (b) => {
      const r = (await b.boundingBox())!
      return {
        x: (r.x - rect.x) / rect.width,
        y: (r.y - rect.y) / rect.height,
        width: r.width / rect.width,
        height: r.height / rect.height,
      }
    }),
  )
  for (const { box } of truth.cookies) {
    expect(Math.max(...found.map((f) => iou(f, box)))).toBeGreaterThanOrEqual(0.8)
  }
})

test('an admin tags cookies with bakers, opens voting and then results', async ({
  page,
}, testInfo) => {
  const eventName = `E2E Voting ${testInfo.project.name} ${Date.now()}`
  await signInAs(page, 'admin@example.com')
  await page.getByRole('link', { name: 'New event' }).click()
  await page.getByLabel('Event name').fill(eventName)
  await page.getByRole('button', { name: 'Create event' }).click()

  // Voting is gated until everything is ready.
  await page.getByRole('button', { name: /^voting/i }).click()
  await expect(page.getByRole('button', { name: 'Open voting' })).toBeDisabled()
  await page.getByRole('link', { name: 'Add the bakers' }).click()
  for (const name of ['ann', 'bob']) {
    await page.getByLabel('Name').fill(name)
    await page.getByRole('button', { name: new RegExp(`^add ${name}$`, 'i') }).click()
  }
  await page.getByRole('button', { name: /^categories/i }).click()
  await addCategory(page, 'Stars', '4-cookies_stars.jpg')
  // Cookies: each new box is tagged with the highlighted baker, who then moves on.
  await page.getByRole('button', { name: /^cookies/i }).click()
  await expect(page.getByText('Tap Ann’s cookie')).toBeVisible()
  const plate = page.getByRole('group', { name: 'Stars plate' })
  await expect(plate.locator('img')).toHaveJSProperty('complete', true)
  await plate.scrollIntoViewIfNeeded()
  await tapOn(page, plate, [0.23, 0.28])
  await expect(plate.getByRole('button', { name: 'Cookie 1, Ann' })).toBeVisible()
  await expect(page.getByText('Tap Bob’s cookie')).toBeVisible()
  await tapOn(page, plate, [0.71, 0.73])
  await expect(plate.getByRole('button', { name: 'Cookie 2, Bob' })).toBeVisible()
  await expect(page.getByText(/everyone has a cookie on this plate/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /^cookies.*\(done\)/i })).toBeVisible()

  // Reassigning: tap a box, pick another baker; Ann is next again until she's tagged.
  await plate.getByRole('button', { name: 'Cookie 1, Ann' }).click()
  const menu = page.getByRole('dialog', { name: 'Who baked cookie 1?' })
  await expect(menu.getByRole('button', { name: 'Ann' })).toHaveAttribute('aria-pressed', 'true')
  await menu.getByRole('button', { name: 'Bob' }).click()
  await expect(plate.getByRole('button', { name: 'Cookie 1, Bob' })).toBeVisible()
  await expect(page.getByText('Tap Ann’s cookie')).toBeVisible()
  await plate.getByRole('button', { name: 'Cookie 2, Bob' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Ann' }).click()
  await expect(plate.getByRole('button', { name: 'Cookie 2, Ann' })).toBeVisible()

  // The last plate moves on to Voting.
  await page.getByRole('button', { name: 'Next: Voting →' }).click()

  // Open voting: the voter link and a live count.
  await page.getByRole('button', { name: 'Open voting' }).click()
  await expect(page.getByRole('heading', { name: 'Voting is open' })).toBeVisible()
  const eventId = page.url().match(/events\/([^/?]+)/)?.[1]
  await expect(page.getByText(`/event/${eventId}`)).toBeVisible()
  await expect(page.getByRole('img', { name: /qr code/i })).toBeVisible()
  await expect(page.getByText(/0\s*ballots so far/)).toBeVisible()

  // The dashboard shows the live event with Open results.
  await page.getByRole('link', { name: /all events/i }).click()
  const row = page.getByRole('listitem').filter({ hasText: eventName })
  await expect(row.getByText('Voting open')).toBeVisible()
  await expect(row.getByText(`/event/${eventId}`)).toBeVisible()
  await row.getByRole('button', { name: 'Open results' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Open results' }).click()
  await expect(row.getByText('Results open')).toBeVisible()
  await expect(row.getByRole('button', { name: 'Open results' })).toBeHidden()
})
