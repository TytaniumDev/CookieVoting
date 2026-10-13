import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { Card } from '../../components/Card/Card.tsx'
import { TextField } from '../../components/TextField/TextField.tsx'
import { createEvent } from '../../lib/mutations.ts'

export function NewEventPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <Card tone="festive" className="mx-auto max-w-md">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!name.trim()) return
          setSaving(true)
          setError(null)
          try {
            const eventId = await createEvent(name)
            navigate(`/admin/events/${eventId}`)
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
            setSaving(false)
          }
        }}
      >
        <h1 className="text-3xl">New event</h1>
        <TextField
          label="Event name"
          placeholder="Christmas Cookie Bake-Off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
        />
        {error && (
          <Alert tone="danger" title="Couldn't create the event">
            {error}
          </Alert>
        )}
        <Button type="submit" size="lg" fullWidth loading={saving} disabled={!name.trim()}>
          Create event
        </Button>
      </form>
    </Card>
  )
}
