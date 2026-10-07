import { useId, type InputHTMLAttributes } from 'react'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  /** Helper text shown under the input. */
  hint?: string
  /** Error message; marks the input invalid and replaces the hint. */
  error?: string
}

/** A labelled single-line input with optional hint and error text. */
export function TextField({ label, hint, error, className = '', ...props }: TextFieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? hint

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={`min-h-11 rounded-control border-2 bg-surface px-3 text-base text-ink placeholder:text-ink-muted disabled:cursor-not-allowed disabled:bg-surface-muted ${error ? 'border-danger' : 'border-border-strong'}`}
        {...props}
      />
      {message && (
        <p
          id={messageId}
          className={`text-sm ${error ? 'font-bold text-danger' : 'text-ink-muted'}`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
