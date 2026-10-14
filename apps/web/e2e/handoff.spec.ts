import { devices, expect, test } from '@playwright/test'
import { expectCategoryNames, nameCategory } from './categories.ts'
import { signInAs } from './signIn.ts'

// Owner requirement (2026-10-13): start an event on a phone, carry on from a laptop
// or another admin's device, with every screen kept in sync.
test('two admins on a phone and a laptop set up one event together', async ({
  page: phone,
  browser,
}, testInfo) => {
  // This test brings its own laptop, so one project is enough.
  test.skip(testInfo.project.name !== 'mobile', 'Covers both devices itself')
  test.slow()
  const laptopContext = await browser.newContext({
    ...devices['Desktop Chrome'],
    baseURL: testInfo.project.use.baseURL,
  })
  const laptop = await laptopContext.newPage()

  // Phone: create the event and upload every plate photo at once.
  await signInAs(phone, 'admin@example.com')
  await phone.getByRole('link', { name: 'New event' }).click()
  await phone.getByLabel('Event name').fill(`E2E Handoff ${Date.now()}`)
  await phone.getByRole('button', { name: 'Create event' }).click()
  await phone.getByRole('button', { name: /^categories/i }).click()
  await phone
    .getByLabel('Upload plate photos')
    .setInputFiles([
      '../../fixtures/plates/4-cookies_stars.jpg',
      '../../fixtures/plates/5-cookies_candy-canes.jpg',
    ])
  await expectCategoryNames(phone, ['Plate 1', 'Plate 2'])

  // Laptop: a co-admin opens the same link and names the plates.
  await signInAs(laptop, 'elf@example.com')
  await laptop.goto(phone.url())
  await expectCategoryNames(laptop, ['Plate 1', 'Plate 2'])
  await nameCategory(laptop, 0, 'Stars')
  await expectCategoryNames(phone, ['Stars', 'Plate 2'])

  // Both box cookies on the same plate: both are kept, and both screens agree. (Merging
  // edits that truly race is unit tested in packages/shared/src/cookies.test.ts.)
  for (const page of [phone, laptop]) {
    await page.getByRole('button', { name: /^cookies/i }).click()
    await page
      .getByRole('navigation', { name: 'Plates' })
      .getByRole('button', { name: /^stars/i })
      .click()
  }
  const phonePlate = phone.getByRole('group', { name: 'Stars plate' })
  const laptopPlate = laptop.getByRole('group', { name: 'Stars plate' })
  await expect(laptopPlate.locator('img')).toHaveJSProperty('complete', true)
  const cookies = /^cookie \d/i
  await Promise.all([
    phone.getByRole('button', { name: 'Add cookie' }).click(),
    laptop.getByRole('button', { name: 'Add cookie' }).click(),
  ])
  await expect(phonePlate.getByRole('button', { name: cookies })).toHaveCount(2)
  await expect(laptopPlate.getByRole('button', { name: cookies })).toHaveCount(2)

  // A delete on the laptop shows up on the phone without a reload. The laptop's new
  // cookie is still selected (both landed in the same spot).
  await laptop.getByRole('button', { name: /^delete cookie \d$/i }).click()
  await expect(phonePlate.getByRole('button', { name: cookies })).toHaveCount(1)

  await laptopContext.close()
})
