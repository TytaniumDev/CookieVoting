import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from '../Spinner/Spinner.tsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Stretch to the width of the container (common on phone screens). */
  fullWidth?: boolean
  /** Shows a spinner and blocks clicks while an action is in flight. */
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary shadow-card hover:bg-primary-hover',
  secondary: 'bg-secondary text-on-secondary shadow-card hover:bg-secondary-hover',
  ghost: 'bg-transparent text-primary hover:bg-surface-muted',
  danger: 'bg-danger text-on-danger shadow-card hover:bg-danger-hover',
}

// Both sizes meet the 44px minimum touch target for phone users.
const sizeClasses: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-base',
  lg: 'min-h-14 px-6 text-lg',
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
      className={`inline-flex items-center justify-center gap-2 rounded-control font-display font-semibold transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" label="" />}
      {children}
    </button>
  )
}
