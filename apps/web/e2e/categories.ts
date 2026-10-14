import { expect, type Page } from '@playwright/test'

const nameFields = (page: Page) =>
  page.getByRole('list', { name: 'Categories' }).getByLabel('Category name')

/** Waits until the Categories step lists exactly these names, in order. */
export async function expectCategoryNames(page: Page, names: string[]) {
  await expect
    .poll(
      async () => Promise.all((await nameFields(page).all()).map((field) => field.inputValue())),
      { timeout: 30_000 },
    )
    .toEqual(names)
}

/** Types a category's name into its field and waits for it to save. */
export async function nameCategory(page: Page, index: number, name: string) {
  await nameFields(page).nth(index).fill(name)
  await nameFields(page).nth(index).press('Enter')
  await expect(page.getByRole('button', { name: `Reorder ${name}` })).toBeAttached()
}

/** On the Categories step: uploads one plate photo and names the category it becomes. */
export async function addCategory(page: Page, name: string, photo: string) {
  const before = await nameFields(page).count()
  await page.getByLabel('Upload plate photos').setInputFiles(`../../fixtures/plates/${photo}`)
  await expect(nameFields(page)).toHaveCount(before + 1, { timeout: 30_000 })
  await nameCategory(page, before, name)
}
