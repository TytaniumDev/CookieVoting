import { buttonClasses } from '../Button/buttonClasses.ts'
import { Card } from '../Card/Card.tsx'
import { ProgressBar } from '../ProgressBar/ProgressBar.tsx'

export interface PlatePhotoUploadProps {
  /** While photos upload: which one (from 1), how many, and how far through it (0..1). */
  progress?: { current: number; total: number; fraction: number } | null
  onFiles: (files: File[]) => void
}

/**
 * Uploads every plate photo at once, e.g. straight from the phone that took them. Each
 * photo becomes a category, which can be renamed later on any device.
 */
export function PlatePhotoUpload({ progress = null, onFiles }: PlatePhotoUploadProps) {
  const percent = progress
    ? Math.round(((progress.current - 1 + progress.fraction) / progress.total) * 100)
    : 0

  return (
    <Card className="space-y-3">
      <h2 className="text-2xl">Plate photos</h2>
      <p className="text-ink-muted">
        Photograph each plate, then upload them all at once. Each photo becomes a category to rename
        here or on any other device.
      </p>
      {progress ? (
        <ProgressBar
          label={`Uploading photo ${progress.current} of ${progress.total}`}
          value={percent}
          max={100}
          valueText={`${percent}%`}
        />
      ) : (
        <label
          className={`${buttonClasses({ variant: 'primary' })} cursor-pointer focus-within:outline-2 focus-within:outline-focus`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="sr-only"
            onChange={(e) => {
              const files = [...(e.target.files ?? [])]
              e.target.value = ''
              if (files.length > 0) onFiles(files)
            }}
          />
          Upload plate photos
        </label>
      )}
    </Card>
  )
}
