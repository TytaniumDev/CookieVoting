/** The link voters open (PRD §11). */
export function voterUrl(eventId: string): string {
  return `${window.location.origin}/event/${encodeURIComponent(eventId)}`
}
