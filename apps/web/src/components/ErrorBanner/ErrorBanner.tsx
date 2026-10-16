import { Alert } from '../Alert/Alert.tsx'

export interface BannerError {
  id: number
  title: string
  message: string
}

export interface ErrorBannerProps {
  errors: readonly BannerError[]
  onDismiss: (id: number) => void
}

/** Errors pinned to the top of the screen (under the app bar) until dismissed. Renders nothing when empty. */
export function ErrorBanner({ errors, onDismiss }: ErrorBannerProps) {
  if (errors.length === 0) return null
  return (
    <div className="sticky top-[calc(var(--app-bar-height,0px)+--spacing(2))] z-30 mb-4 space-y-2 shadow-card">
      {errors.map((error) => (
        <Alert
          key={error.id}
          tone="danger"
          title={error.title}
          onDismiss={() => onDismiss(error.id)}
        >
          {error.message}
        </Alert>
      ))}
    </div>
  )
}
