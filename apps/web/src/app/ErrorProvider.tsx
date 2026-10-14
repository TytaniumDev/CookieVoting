import { useCallback, useState, type ReactNode } from 'react'
import { ErrorBanner, type BannerError } from '../components/ErrorBanner/ErrorBanner.tsx'
import { ErrorContext, errorMessage, type ShowError } from '../lib/errors.ts'

let nextId = 0

/**
 * Collects errors from failed actions and shows them pinned to the top of the page, so
 * they're seen wherever the admin has scrolled to. The same error shown twice appears
 * once.
 */
export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<BannerError[]>([])
  const showError = useCallback<ShowError>((title, error) => {
    const message = errorMessage(error)
    console.error(title, error)
    setErrors((shown) =>
      shown.some((e) => e.title === title && e.message === message)
        ? shown
        : [...shown, { id: nextId++, title, message }],
    )
  }, [])

  return (
    <ErrorContext value={showError}>
      <ErrorBanner
        errors={errors}
        onDismiss={(id) => setErrors((shown) => shown.filter((e) => e.id !== id))}
      />
      {children}
    </ErrorContext>
  )
}
