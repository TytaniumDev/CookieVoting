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
import { useEffect, useId, useRef, useState } from 'react'
import { Badge } from '../Badge/Badge.tsx'
import { PhotoZoom } from '../PhotoZoom/PhotoZoom.tsx'

export interface CategoryListItem {
  id: string
  name: string
  photo: PlatePhoto | null
  cookieCount: number
}

export interface CategoryListProps {
  categories: readonly CategoryListItem[]
  /** Names from past events, offered while typing a name (PRD §6.3). */
  suggestions?: readonly string[]
  onReorder: (categoryIds: string[]) => void
  onRename: (categoryId: string, name: string) => void
  onDelete: (categoryId: string) => void
}

/** How long typing pauses before a name saves. */
const SAVE_DELAY_MS = 800

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * The category's name as a text field that saves itself: after a pause in typing, on
 * Enter and when it loses focus. Renames from other devices show up unless this field
 * is being edited.
 */
function NameField({
  name,
  otherNames,
  suggestionsId,
  onSave,
}: {
  name: string
  otherNames: readonly string[]
  suggestionsId: string | undefined
  onSave: (name: string) => void
}) {
  const [draft, setDraft] = useState(name)
  const [seen, setSeen] = useState(name)
  const [editing, setEditing] = useState(false)
  // The name last saved from here (or from elsewhere), and whether Escape just threw
  // the edit away.
  const [saved, setSaved] = useState(name)
  const cancelled = useRef(false)
  const errorId = useId()
  if (name !== seen) {
    setSeen(name)
    setSaved(name)
    if (!editing) setDraft(name)
  }

  const trimmed = draft.trim()
  const duplicate = otherNames.some((other) => sameName(other, trimmed))
  const valid = trimmed !== '' && !duplicate

  function save() {
    if (!valid || trimmed === saved) return
    setSaved(trimmed)
    onSave(trimmed)
  }

  useEffect(() => {
    if (!editing) return
    const timer = setTimeout(save, SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  })

  return (
    <>
      <input
        aria-label="Category name"
        aria-invalid={duplicate || undefined}
        aria-describedby={duplicate ? errorId : undefined}
        list={suggestionsId}
        value={draft}
        maxLength={60}
        autoComplete="off"
        enterKeyHint="done"
        onFocus={() => setEditing(true)}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            cancelled.current = true
            setDraft(saved)
            e.currentTarget.blur()
          }
        }}
        onBlur={() => {
          if (!cancelled.current) save()
          cancelled.current = false
          setEditing(false)
          if (!valid) setDraft(saved)
        }}
        className={`min-h-11 w-full min-w-0 rounded-control border-2 bg-surface px-2 text-lg font-bold text-ink ${duplicate ? 'border-danger' : 'border-border hover:border-border-strong'}`}
      />
      {duplicate && (
        <p id={errorId} className="text-sm font-bold text-danger">
          Another category has that name.
        </p>
      )}
    </>
  )
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  )
}

function CategoryRow({
  category,
  otherNames,
  suggestionsId,
  onRename,
  onDelete,
}: {
  category: CategoryListItem
  otherNames: readonly string[]
  suggestionsId: string | undefined
} & Pick<CategoryListProps, 'onRename' | 'onDelete'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-card border border-border bg-surface p-2 shadow-card ${isDragging ? 'relative z-10 shadow-raised' : ''}`}
    >
      <div className="flex items-center gap-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Reorder ${category.name}`}
          className="grid min-h-11 min-w-11 shrink-0 cursor-grab touch-none place-items-center rounded-control text-xl text-ink-muted hover:bg-surface-muted"
          {...attributes}
          {...listeners}
        >
          <span aria-hidden="true">⠿</span>
        </button>
        {category.photo ? (
          <PhotoZoom photo={category.photo} label={category.name} className="w-16" />
        ) : (
          <div
            className="grid aspect-4/3 w-16 shrink-0 place-items-center rounded-control bg-surface-muted text-2xl"
            aria-hidden="true"
          >
            📷
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <NameField
            name={category.name}
            otherNames={otherNames}
            suggestionsId={suggestionsId}
            onSave={(name) => onRename(category.id, name)}
          />
          {category.photo ? (
            <p className="px-2 text-sm text-ink-muted">
              {category.cookieCount === 1 ? '1 cookie' : `${category.cookieCount} cookies`}
            </p>
          ) : (
            <Badge tone="warning">Needs a photo</Badge>
          )}
        </div>
        <button
          type="button"
          aria-label={`Delete ${category.name}`}
          onClick={() => onDelete(category.id)}
          className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-control text-ink-muted hover:bg-danger-subtle hover:text-danger"
        >
          <TrashIcon />
        </button>
      </div>
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
  suggestions = [],
  onReorder,
  onRename,
  onDelete,
}: CategoryListProps) {
  const suggestionsId = useId()
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
              otherNames={categories.filter((c) => c !== category).map((c) => c.name)}
              suggestionsId={suggestions.length > 0 ? suggestionsId : undefined}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </ol>
        {suggestions.length > 0 && (
          <datalist id={suggestionsId}>
            {suggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        )}
      </SortableContext>
    </DndContext>
  )
}
