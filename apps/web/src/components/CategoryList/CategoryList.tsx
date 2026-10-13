import type { PlatePhoto } from '@cookie-voting/shared'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { Badge } from '../Badge/Badge.tsx'
import { Button } from '../Button/Button.tsx'
import { buttonClasses } from '../Button/buttonClasses.ts'
import { CookieImage } from '../CookieImage/CookieImage.tsx'
import { ProgressBar } from '../ProgressBar/ProgressBar.tsx'
import { TextField } from '../TextField/TextField.tsx'

export interface CategoryListItem {
  id: string
  name: string
  photo: PlatePhoto | null
  cookieCount: number
}

export interface CategoryListProps {
  categories: readonly CategoryListItem[]
  /** categoryId -> upload progress (0..1) while a photo is uploading. */
  uploads?: Readonly<Record<string, number>>
  onReorder: (categoryIds: string[]) => void
  onRename: (categoryId: string, name: string) => void
  onDelete: (categoryId: string) => void
  onPhoto: (categoryId: string, file: File) => void
}

const WHOLE_PHOTO = { x: 0, y: 0, width: 1, height: 1 }

function CategoryRow({
  category,
  progress,
  onRename,
  onDelete,
  onPhoto,
}: {
  category: CategoryListItem
  progress: number | undefined
} & Pick<CategoryListProps, 'onRename' | 'onDelete' | 'onPhoto'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(category.name)
  const uploading = progress !== undefined

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-card border border-border bg-surface p-3 shadow-card ${isDragging ? 'relative z-10 shadow-raised' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Reorder ${category.name}`}
          className="grid min-h-11 min-w-11 cursor-grab touch-none place-items-center rounded-control text-xl text-ink-muted hover:bg-surface-muted"
          {...attributes}
          {...listeners}
        >
          <span aria-hidden="true">⠿</span>
        </button>
        <div className="w-16 shrink-0 overflow-hidden rounded-control">
          {category.photo ? (
            <CookieImage photo={category.photo} box={WHOLE_PHOTO} alt="" />
          ) : (
            <div
              className="grid aspect-4/3 place-items-center bg-surface-muted text-2xl"
              aria-hidden="true"
            >
              📷
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg">{category.name}</h3>
          {category.photo ? (
            <p className="text-sm text-ink-muted">
              {category.cookieCount === 1 ? '1 cookie' : `${category.cookieCount} cookies`}
            </p>
          ) : (
            <Badge tone="warning">Needs a photo</Badge>
          )}
        </div>
      </div>

      {uploading && (
        <ProgressBar
          className="mt-3"
          label="Uploading photo"
          value={Math.round(progress * 100)}
          max={100}
          valueText={`${Math.round(progress * 100)}%`}
        />
      )}

      {renaming ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) onRename(category.id, name)
            setRenaming(false)
          }}
        >
          <TextField
            label="New name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={!name.trim()}>
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setName(category.name)
                setRenaming(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <label
            className={`${buttonClasses({ variant: 'secondary' })} ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'} focus-within:outline-2 focus-within:outline-focus`}
          >
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) onPhoto(category.id, file)
              }}
            />
            {category.photo ? 'Replace photo' : 'Add photo'}
            <span className="sr-only"> for {category.name}</span>
          </label>
          <Button variant="ghost" onClick={() => setRenaming(true)}>
            Rename<span className="sr-only"> {category.name}</span>
          </Button>
          <Button variant="ghost" onClick={() => onDelete(category.id)}>
            Delete<span className="sr-only"> {category.name}</span>
          </Button>
        </div>
      )}
    </li>
  )
}

/**
 * The event's categories in display order. Drag the handle (or focus it and use the
 * arrow keys) to reorder; only the handle starts a drag, so the list still scrolls on
 * phones.
 */
export function CategoryList({
  categories,
  uploads = {},
  onReorder,
  onRename,
  onDelete,
  onPhoto,
}: CategoryListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = categories.map((c) => c.id)
  const nameOf = (id: string | number) => categories.find((c) => c.id === id)?.name ?? 'Category'
  const position = (id: string | number | undefined) =>
    `position ${ids.indexOf(String(id)) + 1} of ${ids.length}`
  // Screen-reader announcements in words, not the default internal ids.
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} moved to ${position(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} dropped at ${position(over.id)}.`
        : `${nameOf(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Moving ${nameOf(active.id)} was cancelled.`,
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from !== -1 && to !== -1) onReorder(arrayMove(ids, from, to))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol aria-label="Categories" className="space-y-3">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              progress={uploads[category.id]}
              onRename={onRename}
              onDelete={onDelete}
              onPhoto={onPhoto}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}
