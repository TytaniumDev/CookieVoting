export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

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

/** Button styles for other elements, e.g. a router `Link` that should look like a button. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean } = {}): string {
  return `inline-flex items-center justify-center gap-2 rounded-control font-display font-semibold transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''}`
}
