import { Spinner } from '../components/Spinner/Spinner.tsx'

/** Shown before the first route loads, so there's no app bar yet: centre in the whole screen. */
export function LoadingScreen() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner layout="section" size="lg" label="Loading" />
    </div>
  )
}
