import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from '../Spinner/Spinner.tsx'
import {
  buttonClasses,
  type ButtonFlush,
  type ButtonSize,
  type ButtonVariant,
} from './buttonClasses.ts'

export type { ButtonFlush, ButtonSize, ButtonVariant }

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Stretch to the width of the container (common on phone screens). */
  fullWidth?: boolean
  /** Pull a ghost button out by its padding at the start or end of a row (see `buttonClasses`). */
  flush?: ButtonFlush
  /** Shows a spinner and blocks clicks while an action is in flight. */
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  flush,
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
      className={`${buttonClasses({ variant, size, fullWidth, flush })} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" label="" />}
      {children}
    </button>
  )
}
