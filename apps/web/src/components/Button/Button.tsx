import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from '../Spinner/Spinner.tsx'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonClasses.ts'

export type { ButtonSize, ButtonVariant }

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Stretch to the width of the container (common on phone screens). */
  fullWidth?: boolean
  /** Shows a spinner and blocks clicks while an action is in flight. */
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  type = 'button',
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClasses({ variant, size, fullWidth })} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" label="" />}
      {children}
    </button>
  )
}
