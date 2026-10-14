import { expect, test } from '@playwright/test'
import { signInAs } from './signIn.ts'

test('an admin lets someone in from the Admins page, and takes them off again', async ({
  page: admin,
  browser,
}, testInfo) => {
  const newcomerEmail = `helper-${testInfo.project.name}-${Date.now()}@example.com`
  const newcomer = await (await browser.newContext(testInfo.project.use)).newPage()

  // Not on the list yet.
  await signInAs(newcomer, newcomerEmail.toUpperCase())
  await expect(newcomer.getByText('Not on the admin list')).toBeVisible()

  await signInAs(admin, 'admin@example.com')
  await admin.getByRole('link', { name: 'Admins' }).click()
  await expect(admin.getByRole('heading', { name: 'Admins', level: 1 })).toBeVisible()
  await expect(admin.getByRole('button', { name: 'Remove admin@example.com' })).toHaveCount(0)
  await admin.getByLabel('Google email').fill(newcomerEmail.toUpperCase())
  await admin.getByRole('button', { name: 'Add admin' }).click()
  await expect(admin.getByText(`Added by admin@example.com`).first()).toBeVisible()

  // The newcomer's screen lets them in without a reload.
  await expect(newcomer.getByRole('heading', { name: 'Your events' })).toBeVisible()

  await admin.getByRole('button', { name: `Remove ${newcomerEmail}` }).click()
  await admin.getByRole('dialog').getByRole('button', { name: 'Remove' }).click()
  await expect(admin.getByRole('button', { name: `Remove ${newcomerEmail}` })).toHaveCount(0)
  await expect(newcomer.getByText('Not on the admin list')).toBeVisible()
  await newcomer.context().close()
})

test('someone asks to be an admin and an admin approves them', async ({
  page: admin,
  browser,
}, testInfo) => {
  const email = `asker-${testInfo.project.name}-${Date.now()}@example.com`
  const asker = await (await browser.newContext(testInfo.project.use)).newPage()

  await signInAs(asker, email)
  await asker.getByRole('button', { name: 'Ask to be an admin' }).click()
  await expect(asker.getByText('Request sent')).toBeVisible()

  // Admins see it on their dashboard and approve it on the Admins page.
  await signInAs(admin, 'admin@example.com')
  await expect(admin.getByText(/want(s)? to be (an )?admins?/)).toBeVisible()
  await admin.getByRole('link', { name: 'Review on the Admins page' }).click()
  await admin.getByRole('button', { name: `Approve ${email}` }).click()
  await expect(admin.getByRole('button', { name: `Remove ${email}` })).toBeVisible()
  await expect(admin.getByRole('button', { name: `Approve ${email}` })).toHaveCount(0)

  // The asker is let in without a reload.
  await expect(asker.getByRole('heading', { name: 'Your events' })).toBeVisible()
  await asker.context().close()
})

test('a declined request can be made again', async ({ page: admin, browser }, testInfo) => {
  const email = `decline-${testInfo.project.name}-${Date.now()}@example.com`
  const asker = await (await browser.newContext(testInfo.project.use)).newPage()
  await signInAs(asker, email)
  await asker.getByRole('button', { name: 'Ask to be an admin' }).click()
  await expect(asker.getByText('Request sent')).toBeVisible()

  await signInAs(admin, 'admin@example.com')
  await admin.goto('/admin/admins')
  await admin.getByRole('button', { name: `Decline ${email}` }).click()
  await expect(admin.getByRole('button', { name: `Decline ${email}` })).toHaveCount(0)
  await expect(asker.getByRole('button', { name: 'Ask to be an admin' })).toBeVisible()
  await asker.context().close()
})
