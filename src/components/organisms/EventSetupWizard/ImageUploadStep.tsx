import React, { useRef } from 'react';
import { validateImage } from '../../../lib/validation';
import styles from './EventSetupWizard.module.css';

export interface UploadedImage {
  file: File;
  preview: string;
  uploaded: boolean;
  imageUrl?: string;
  categoryName?: string;
  name?: string;
}

interface Props {
  images: UploadedImage[];
  uploading: boolean;
  onFilesSelect: (files: UploadedImage[]) => void;
  onRemoveImage: (index: number) => void;
  onUpload: () => Promise<void>;
  onCancel: () => void;
  onNext: () => void;
  hasExistingCategories: boolean;
  error?: string | null;
}

export function ImageUploadStep({
  images,
  uploading,
  onFilesSelect,
  onRemoveImage,
  onUpload,
  onCancel,
  onNext,
  hasExistingCategories,
  error
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const validFiles: UploadedImage[] = [];

    for (const file of files) {
      const validation = validateImage(file);
      if (validation.valid) {
        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          uploaded: false,
          name: file.name
        });
      }
    }

    onFilesSelect(validFiles);
    if (e.target.files) {
      e.target.value = '';
    }
  };

  return (
    <div className={styles.stepContent}>
      <h2>Upload Cookie Images</h2>
      <p className={styles.instruction}>Upload all cookie images at once (typically ~10 images)</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileSelect}
        className={styles.fileInput}
        disabled={uploading}
      />

      {images.length > 0 && (
        <div className={styles.imageGrid}>
          {images.map((img, index) => {
            const imageKey = img.name || img.preview || `image-${index}`;
            const uniqueKey = `upload-${imageKey.slice(-50)}-${index}`;
            return (
              <div key={uniqueKey} className={styles.imageCard}>
                <img src={img.preview} alt={`Preview ${index + 1}`} />
                <button
                  onClick={() => onRemoveImage(index)}
                  className={styles.removeButton}
                  disabled={uploading}
                >
                  ×
                </button>
                {img.uploaded && (
                  <div className={styles.uploadedBadge}>✓ Uploaded</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button onClick={onCancel} className={styles.buttonSecondary} disabled={uploading}>
          Cancel
        </button>
        {hasExistingCategories && (
          <button
            onClick={onNext}
            className={styles.buttonSecondary}
            disabled={uploading}
          >
            Next: Name Categories →
          </button>
        )}
        <button
          onClick={onUpload}
          disabled={uploading || images.length === 0}
          className={styles.buttonPrimary}
        >
          {uploading ? 'Uploading...' : hasExistingCategories ? 'Add More Images' : `Upload ${images.length} Image${images.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
