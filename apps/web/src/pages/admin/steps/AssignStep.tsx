import { Link } from 'react-router'
import { Alert } from '../../../components/Alert/Alert.tsx'
import { Badge } from '../../../components/Badge/Badge.tsx'
import { BakerPicker } from '../../../components/BakerPicker/BakerPicker.tsx'
import { CookieImage } from '../../../components/CookieImage/CookieImage.tsx'
import { Spinner } from '../../../components/Spinner/Spinner.tsx'
import { useBakers, type Category, type Setup } from '../../../lib/data.ts'
import { useShowError } from '../../../lib/errors.ts'
import { assignBaker } from '../../../lib/mutations.ts'

export function AssignStep({
  eventId,
  categories,
  setup,
}: {
  eventId: string
  categories: readonly Category[]
  setup: Setup | null
}) {
  const bakers = useBakers()
  const showError = useShowError()

  if (bakers.status === 'loading') return <Spinner label="Loading bakers" />
  if (bakers.status === 'error') {
    return (
      <Alert tone="danger" title="Couldn't load bakers">
        {bakers.error.message}
      </Alert>
    )
  }

  const rosterIds = new Set(setup?.bakerIds ?? [])
  const roster = bakers.data
    .filter((b) => rosterIds.has(b.id))
    .map((b) => ({ id: b.id, name: b.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const withCookies = categories.filter((c) => c.photo && c.cookies.length > 0)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl">Assign bakers</h2>
        <p className="text-ink-muted">
          Pick who baked each cookie. Voters won't see this until results open.
        </p>
      </div>
      {roster.length === 0 && (
        <Alert tone="warning" title="No bakers yet">
          <Link to="?step=bakers">Add the event's bakers</Link> first.
        </Alert>
      )}
      {withCookies.length === 0 && (
        <Alert tone="warning" title="No cookies yet">
          <Link to="?step=cookies">Box the cookies on each plate</Link> first.
        </Alert>
      )}

      {withCookies.map((category) => {
        const assignments = setup?.assignments[category.id] ?? {}
        const assigned = category.cookies.filter((c) => {
          const bakerId = assignments[c.id]
          return bakerId !== undefined && rosterIds.has(bakerId)
        }).length
        const photo = category.photo!
        return (
          <section
            key={category.id}
            className="space-y-3"
            aria-labelledby={`assign-${category.id}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id={`assign-${category.id}`} className="text-xl">
                {category.name}
              </h3>
              <Badge tone={assigned === category.cookies.length ? 'success' : 'warning'}>
                {assigned} of {category.cookies.length} assigned
              </Badge>
            </div>
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {category.cookies.map((cookie, index) => {
                const bakerId = assignments[cookie.id]
                return (
                  <li
                    key={cookie.id}
                    className="space-y-2 rounded-card border border-border bg-surface p-2 shadow-card"
                  >
                    <div className="relative">
                      <CookieImage
                        photo={photo}
                        box={cookie.box}
                        alt=""
                        className="rounded-control"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute top-1 left-1 rounded-full bg-accent px-2 font-display font-bold text-on-accent"
                      >
                        {index + 1}
                      </span>
                    </div>
                    <BakerPicker
                      bakers={roster}
                      value={bakerId !== undefined && rosterIds.has(bakerId) ? bakerId : null}
                      onChange={(id) => {
                        assignBaker(eventId, category.id, cookie.id, id).catch((e: unknown) =>
                          showError("That didn't save", e),
                        )
                      }}
                      label={`Baker for ${category.name} cookie ${index + 1}`}
                      hideLabel
                    />
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
