import type { Cookie } from '@cookie-voting/shared'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Alert } from '../../../components/Alert/Alert.tsx'
import { Card } from '../../../components/Card/Card.tsx'
import { PlateEditor, type TapToSelect } from '../../../components/PlateEditor/PlateEditor.tsx'
import { Stepper } from '../../../components/Stepper/Stepper.tsx'
import { useCookieFinder } from '../../../lib/cookieFinder/useCookieFinder.ts'
import type { Category } from '../../../lib/data.ts'
import { saveCookies } from '../../../lib/mutations.ts'

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e))

export function CookiesStep({
  eventId,
  categories,
}: {
  eventId: string
  categories: readonly Category[]
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const finder = useCookieFinder()
  const tapToSelect: TapToSelect =
    finder.status === 'ready'
      ? { status: 'ready', find: (photo, point) => finder.finder.find(photo, point) }
      : finder

  if (categories.length === 0) {
    return (
      <Card>
        <h2 className="text-2xl">Cookies</h2>
        <p className="text-ink-muted">Add categories with plate photos first.</p>
      </Card>
    )
  }

  // Open the category named in the URL, else the first one still without cookies.
  const requested = categories.find((c) => c.id === searchParams.get('category'))
  const category =
    requested ?? categories.find((c) => c.photo && c.cookies.length === 0) ?? categories[0]!

  function save(next: Cookie[], base: readonly Cookie[]) {
    setError(null)
    saveCookies(eventId, category.id, base, next).catch((e: unknown) => setError(errorMessage(e)))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl">Cookies</h2>
        <p className="text-ink-muted">
          Box every cookie on each plate. Tap a box to move it or drag its corners to resize it;
          pinch to zoom.
        </p>
      </div>
      <Stepper
        label="Categories"
        steps={categories.map((c) => ({ id: c.id, label: c.name, done: c.cookies.length > 0 }))}
        selected={category.id}
        onSelect={(id) =>
          setSearchParams(
            (params) => {
              params.set('category', id)
              return params
            },
            { replace: true },
          )
        }
      />
      {error && (
        <Alert tone="danger" title="That didn't save">
          {error}
        </Alert>
      )}
      {category.photo ? (
        <PlateEditor
          key={category.id}
          photo={category.photo}
          cookies={category.cookies}
          onChange={save}
          tapToSelect={tapToSelect}
          label={`${category.name} plate`}
        />
      ) : (
        <Alert tone="warning" title={`${category.name} needs a photo`}>
          Add one in the Categories step, then come back to box its cookies.
        </Alert>
      )}
    </div>
  )
}
