interface ImportMetaEnv {
  /** Emulator builds (E2E, local preview). */
  readonly VITE_USE_EMULATORS?: string
  /** reCAPTCHA Enterprise site key; App Check is off without it (docs/SETUP.md §7). */
  readonly VITE_RECAPTCHA_SITE_KEY?: string
  /** Sentry project DSN; error reporting is off without it (docs/SETUP.md §6). */
  readonly VITE_SENTRY_DSN?: string
  /** `production` or `preview`; set by the deploy jobs. */
  readonly VITE_SENTRY_ENVIRONMENT?: string
  /** The commit being deployed, so errors are tied to a release. */
  readonly VITE_SENTRY_RELEASE?: string
}
