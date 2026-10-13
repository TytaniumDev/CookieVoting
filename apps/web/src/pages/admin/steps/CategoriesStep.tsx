import { useState } from 'react'
import { Alert } from '../../../components/Alert/Alert.tsx'
import { Card } from '../../../components/Card/Card.tsx'
import { CategoryList } from '../../../components/CategoryList/CategoryList.tsx'
import { CategoryNameForm } from '../../../components/CategoryNameForm/CategoryNameForm.tsx'
import { ConfirmDialog } from '../../../components/ConfirmDialog/ConfirmDialog.tsx'
import { usePastCategoryNames, useResults, type Category } from '../../../lib/data.ts'
import {
  addCategory,
  deleteCategory,
  renameCategory,
  reorderCategories,
} from '../../../lib/mutations.ts'
import { uploadPlatePhoto } from '../../../lib/storage.ts'

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e))

export function CategoriesStep({
  eventId,
  categories,
}: {
  eventId: string
  categories: readonly Category[]
}) {
  const pastNames = usePastCategoryNames()
  const results = useResults(eventId)
  const [adding, setAdding] = useState(false)
  const [uploads, setUploads] = useState<Record<string, number>>({})
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Shown in the new order straight away, before Firestore confirms it.
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null)

  const ordered = pendingOrder
    ? pendingOrder.flatMap((id) => categories.find((c) => c.id === id) ?? [])
    : categories
  const ballotCount = results.status === 'ready' ? (results.data?.ballotCount ?? 0) : 0

  async function run(action: () => Promise<unknown>) {
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <h2 className="text-2xl">Add a category</h2>
        <CategoryNameForm
          existingNames={categories.map((c) => c.name)}
          pastNames={pastNames.status === 'ready' ? pastNames.data : []}
          adding={adding}
          onAdd={(name) => {
            setAdding(true)
            void run(() => addCategory(eventId, name, categories.length)).finally(() =>
              setAdding(false),
            )
          }}
        />
      </Card>

      {error && (
        <Alert tone="danger" title="That didn't save">
          {error}
        </Alert>
      )}

      {ordered.length === 0 ? (
        <p className="text-ink-muted">No categories yet.</p>
      ) : (
        <section className="space-y-3" aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="text-2xl">
            Categories <span className="text-ink-muted">({ordered.length})</span>
          </h2>
          <p className="text-ink-muted">
            Each category needs a photo of its plate. Drag ⠿ to change the order voters see.
          </p>
          <CategoryList
            categories={ordered.map((c) => ({
              id: c.id,
              name: c.name,
              photo: c.photo,
              cookieCount: c.cookies.length,
            }))}
            uploads={uploads}
            onReorder={(ids) => {
              setPendingOrder(ids)
              void run(() => reorderCategories(eventId, ids)).finally(() => setPendingOrder(null))
            }}
            onRename={(id, name) => void run(() => renameCategory(eventId, id, name))}
            onDelete={(id) => setDeleting(categories.find((c) => c.id === id) ?? null)}
            onPhoto={(id, file) => {
              const previous = categories.find((c) => c.id === id)?.photo ?? null
              setUploads((u) => ({ ...u, [id]: 0 }))
              void run(() =>
                uploadPlatePhoto(eventId, id, file, previous, (fraction) =>
                  setUploads((u) => ({ ...u, [id]: fraction })),
                ),
              ).finally(() => setUploads(({ [id]: _done, ...rest }) => rest))
            }}
          />
        </section>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? 'category'}?`}
        confirmLabel="Delete"
        tone="danger"
        busy={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          setDeleteBusy(true)
          void run(() => deleteCategory(eventId, deleting.id, deleting.photo)).finally(() => {
            setDeleteBusy(false)
            setDeleting(null)
          })
        }}
      >
        Its plate photo, cookies and baker assignments are deleted too.
        {ballotCount > 0 &&
          ` ${ballotCount} ${ballotCount === 1 ? 'person has' : 'people have'} already voted; their picks in this category will stop counting.`}
      </ConfirmDialog>
    </div>
  )
}
