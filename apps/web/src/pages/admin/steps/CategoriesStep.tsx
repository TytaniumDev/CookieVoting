import { plateNames } from '@cookie-voting/shared'
import { useState } from 'react'
import { Card } from '../../../components/Card/Card.tsx'
import { CategoryList } from '../../../components/CategoryList/CategoryList.tsx'
import { CategoryNameForm } from '../../../components/CategoryNameForm/CategoryNameForm.tsx'
import { ConfirmDialog } from '../../../components/ConfirmDialog/ConfirmDialog.tsx'
import {
  PlatePhotoUpload,
  type PlatePhotoUploadProps,
} from '../../../components/PlatePhotoUpload/PlatePhotoUpload.tsx'
import { usePastCategoryNames, useResults, type Category } from '../../../lib/data.ts'
import { useShowError } from '../../../lib/errors.ts'
import {
  addCategory,
  deleteCategory,
  renameCategory,
  reorderCategories,
} from '../../../lib/mutations.ts'
import { storePlatePhoto, uploadPlatePhoto } from '../../../lib/storage.ts'

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
  const [bulk, setBulk] = useState<PlatePhotoUploadProps['progress']>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const showError = useShowError()
  // Shown in the new order straight away, before Firestore confirms it.
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null)

  const ordered = pendingOrder
    ? pendingOrder.flatMap((id) => categories.find((c) => c.id === id) ?? [])
    : categories
  const ballotCount = results.status === 'ready' ? (results.data?.ballotCount ?? 0) : 0

  async function run(action: () => Promise<unknown>) {
    try {
      await action()
    } catch (e) {
      showError("That didn't save", e)
    }
  }

  // One at a time, so a phone on slow Wi-Fi finishes each photo before starting the
  // next. A category is only created once its photo is stored, so an upload cut short
  // leaves no empty categories behind.
  async function uploadPlates(files: File[]) {
    const names = plateNames(
      categories.map((c) => c.name),
      files.length,
    )
    for (const [i, file] of files.entries()) {
      setBulk({ current: i + 1, total: files.length, fraction: 0 })
      const photo = await storePlatePhoto(eventId, file, (fraction) =>
        setBulk({ current: i + 1, total: files.length, fraction }),
      )
      await addCategory(eventId, names[i]!, categories.length + i, photo)
    }
  }

  return (
    <div className="space-y-6">
      <PlatePhotoUpload
        progress={bulk}
        onFiles={(files) => void run(() => uploadPlates(files)).finally(() => setBulk(null))}
      />

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
