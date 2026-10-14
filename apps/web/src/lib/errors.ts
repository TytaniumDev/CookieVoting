import { createContext, useContext } from 'react'

/** Shows a failed action's error at the top of the page, e.g. `showError("That didn't save", e)`. */
export type ShowError = (title: string, error: unknown) => void

export const ErrorContext = createContext<ShowError>(() => {})

/** Where failed saves and other actions report their errors (see `app/ErrorProvider.tsx`). */
export function useShowError(): ShowError {
  return useContext(ErrorContext)
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e))
