import { nextBaker, type Cookie } from '@cookie-voting/shared'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Alert } from '../../../components/Alert/Alert.tsx'
import { BakerChips } from '../../../components/BakerChips/BakerChips.tsx'
import { BakerMenu } from '../../../components/BakerMenu/BakerMenu.tsx'
import { Button } from '../../../components/Button/Button.tsx'
import { Card } from '../../../components/Card/Card.tsx'
import { PlateEditor, type TapToSelect } from '../../../components/PlateEditor/PlateEditor.tsx'
import { PlateTabs } from '../../../components/PlateTabs/PlateTabs.tsx'
import { Spinner } from '../../../components/Spinner/Spinner.tsx'
import { useCookieFinder } from '../../../lib/cookieFinder/useCookieFinder.ts'
import { useBakers, type Category, type Setup } from '../../../lib/data.ts'
import { useShowError } from '../../../lib/errors.ts'
import { assignBaker, saveCookies } from '../../../lib/mutations.ts'

/**
 * Box every cookie on each plate and tag it with its baker in one go: tapping a cookie
 * boxes it and tags it with the highlighted baker, then the highlight moves to the next
 * baker without a cookie on this plate. The plate only changes when the admin says so.
 */
export function CookiesStep({
  eventId,
  categories,
  setup,
}: {
  eventId: string
  categories: readonly Category[]
  setup: Setup | null
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const showError = useShowError()
  const bakers = useBakers()
  const finder = useCookieFinder()
  const tapToSelect: TapToSelect =
    finder.status === 'ready'
      ? { status: 'ready', find: (photo, point) => finder.finder.find(photo, point) }
      : finder
  // Without ?category, open the first plate still to do and stay there: boxing its first
  // cookie mustn't send the admin to the next plate.
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  // A baker the admin tapped to go next, until they tag a cookie or change plate.
  const [picked, setPicked] = useState<{ categoryId: string; bakerId: string } | null>(null)

  if (categories.length === 0) {
    return (
      <Card>
        <h2 className="text-2xl">Cookies</h2>
        <p className="text-ink-muted">Add categories with plate photos first.</p>
      </Card>
    )
  }
  if (bakers.status === 'loading') return <Spinner layout="section" label="Loading bakers" />
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
  const nameOf = new Map(roster.map((b) => [b.id, b.name]))
  const allAssignments = setup?.assignments ?? {}
  const isTagged = (category: Category, cookie: Cookie) =>
    nameOf.has(allAssignments[category.id]?.[cookie.id] ?? '')
  const plateDone = (c: Category) => c.cookies.length > 0 && c.cookies.every((k) => isTagged(c, k))

  const opening =
    categories.find((c) => c.id === pinnedId) ??
    categories.find((c) => c.photo && !plateDone(c)) ??
    categories[0]!
  if (pinnedId === null) setPinnedId(opening.id)
  const category = categories.find((c) => c.id === searchParams.get('category')) ?? opening
  const index = categories.indexOf(category)
  const nextCategory = categories[index + 1]

  const assignments = allAssignments[category.id] ?? {}
  const cookieIds = category.cookies.map((c) => c.id)
  const tags = Object.fromEntries(
    category.cookies.map((c) => [c.id, nameOf.get(assignments[c.id] ?? '') ?? null]),
  )
  const counts = new Map<string, number>()
  for (const id of cookieIds) {
    const bakerId = assignments[id]
    if (bakerId !== undefined) counts.set(bakerId, (counts.get(bakerId) ?? 0) + 1)
  }
  const pickedHere = picked?.categoryId === category.id ? picked.bakerId : null
  const active =
    pickedHere !== null && nameOf.has(pickedHere)
      ? pickedHere
      : nextBaker(
          roster.map((b) => b.id),
          cookieIds,
          assignments,
        )
  const untagged = category.cookies.filter((c) => !isTagged(category, c)).length

  function save(next: Cookie[], base: readonly Cookie[]) {
    saveCookies(eventId, category.id, base, next).catch((e: unknown) =>
      showError("That didn't save", e),
    )
  }

  function tag(cookieId: string, bakerId: string) {
    assignBaker(eventId, category.id, cookieId, bakerId).catch((e: unknown) =>
      showError("That didn't save", e),
    )
  }

  function goTo(categoryId: string) {
    setPicked(null)
    setSearchParams(
      (params) => {
        params.set('category', categoryId)
        return params
      },
      { replace: true },
    )
  }

  // A warning needs reading, so it gets a row; the usual prompt floats on the photo.
  const warning =
    roster.length > 0 && untagged > 0 && active === null ? (
      <Alert
        tone="warning"
        title={`${untagged === 1 ? '1 cookie needs' : `${untagged} cookies need`} a baker`}
      >
        Tap {untagged === 1 ? 'it' : 'each one'} to choose who baked it.
      </Alert>
    ) : null
  const banner =
    roster.length === 0 || warning ? null : active !== null ? (
      <p className="rounded-full bg-primary px-4 py-1.5 font-bold text-on-primary shadow-raised">
        <span aria-hidden="true">👆 </span>Tap {nameOf.get(active)}’s cookie
      </p>
    ) : (
      <p className="rounded-full bg-success px-4 py-1.5 font-bold text-on-success shadow-raised">
        <span aria-hidden="true">✓ </span>Everyone has a cookie on this plate
      </p>
    )
  const plateIsDone = plateDone(category)

  return (
    <div className="space-y-4">
      <h2 className="sr-only">Cookies</h2>
      <PlateTabs
        plates={categories.map((c) => ({
          id: c.id,
          name: c.name,
          photo: c.photo,
          done: plateDone(c),
        }))}
        selected={category.id}
        onSelect={goTo}
      />
      {roster.length === 0 ? (
        <Alert tone="warning" title="No bakers yet">
          <Link to="?step=bakers">Add the event's bakers</Link> to tag each cookie. You can box
          cookies meanwhile.
        </Alert>
      ) : (
        <BakerChips
          bakers={roster.map((b) => ({ ...b, count: counts.get(b.id) ?? 0 }))}
          active={active}
          onSelect={(bakerId) => setPicked({ categoryId: category.id, bakerId })}
        />
      )}
      <div aria-live="polite" className="empty:hidden">
        {warning}
      </div>
      {category.photo ? (
        <PlateEditor
          key={category.id}
          photo={category.photo}
          cookies={category.cookies}
          onChange={save}
          tapToSelect={tapToSelect}
          label={`${category.name} plate`}
          // Leaves room for the Next button under the photo.
          spaceBelow={84}
          banner={<div aria-live="polite">{banner}</div>}
          tags={roster.length > 0 ? tags : undefined}
          onCreate={(cookie) => {
            if (roster.length === 0) return false
            if (active === null) return true
            tag(cookie.id, active)
            setPicked(null)
            return false
          }}
          renderMenu={
            roster.length > 0
              ? (cookie, { number, close, remove }) => (
                  <BakerMenu
                    title={`Cookie ${number}`}
                    bakers={roster}
                    value={
                      nameOf.has(assignments[cookie.id] ?? '') ? assignments[cookie.id]! : null
                    }
                    onChange={(bakerId) => {
                      tag(cookie.id, bakerId)
                      close()
                    }}
                    onDelete={remove}
                    onClose={close}
                  />
                )
              : undefined
          }
        />
      ) : (
        <Alert tone="warning" title={`${category.name} needs a photo`}>
          Add one in the Categories step, then come back to box its cookies.
        </Alert>
      )}
      <div className="flex justify-end">
        {nextCategory ? (
          <Button
            variant={plateIsDone ? 'primary' : 'secondary'}
            onClick={() => goTo(nextCategory.id)}
          >
            Next plate: {nextCategory.name} →
          </Button>
        ) : (
          <Button
            variant={plateIsDone ? 'primary' : 'secondary'}
            onClick={() => setSearchParams({ step: 'voting' }, { replace: true })}
          >
            Next: Voting →
          </Button>
        )}
      </div>
    </div>
  )
}
