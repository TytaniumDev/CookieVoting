/**
 * An email typed into the Admins page, as an `admins/{email}` doc id: trimmed and
 * lowercased. `null` when it doesn't look like an email address.
 */
export function normaliseEmail(input: string): string | null {
  const email = input.trim().toLowerCase()
  return /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email) ? email : null
}
