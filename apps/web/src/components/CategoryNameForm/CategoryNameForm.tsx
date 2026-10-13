import { suggestCategoryNames } from '@cookie-voting/shared'
import { useState } from 'react'
import { Button } from '../Button/Button.tsx'
import { TextField } from '../TextField/TextField.tsx'

export interface CategoryNameFormProps {
  /** Names this event already uses. */
  existingNames: readonly string[]
  /** Every category name from past events, repeats included (they rank suggestions). */
  pastNames: readonly string[]
  onAdd: (name: string) => void
  adding?: boolean
}

/** Adds a category, suggesting names from past events, most used first (PRD §6.3). */
export function CategoryNameForm({
  existingNames,
  pastNames,
  onAdd,
  adding = false,
}: CategoryNameFormProps) {
  const [name, setName] = useState('')
  const trimmed = name.trim()
  const duplicate = existingNames.some((n) => n.trim().toLowerCase() === trimmed.toLowerCase())
  const suggestions = suggestCategoryNames(pastNames, existingNames, name)

  function add(value: string) {
    onAdd(value)
    setName('')
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (trimmed && !duplicate) add(trimmed)
      }}
    >
      <TextField
        label="Category name"
        placeholder="Gingerbread"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={duplicate ? 'This event already has a category with that name.' : undefined}
        autoComplete="off"
        maxLength={60}
      />
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm text-ink-muted" id="category-suggestions">
            Used before:
          </p>
          <ul aria-labelledby="category-suggestions" className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => add(suggestion)}
                  className="min-h-11 rounded-full border-2 border-border bg-surface px-4 font-bold text-ink hover:bg-surface-muted"
                >
                  + {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button type="submit" fullWidth loading={adding} disabled={!trimmed || duplicate}>
        Add category
      </Button>
    </form>
  )
}
