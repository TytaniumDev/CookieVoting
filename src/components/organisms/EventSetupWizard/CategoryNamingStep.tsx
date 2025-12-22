import React, { useRef, useEffect } from 'react';
import styles from './EventSetupWizard.module.css';
import { type UploadedImage } from './ImageUploadStep';

interface Props {
  images: UploadedImage[];
  uploading: boolean;
  onNameChange: (index: number, name: string) => void;
  onCreateCategories: () => Promise<void>;
  onBack: () => void;
  onNext: () => void;
  hasExistingCategories: boolean;
  error?: string | null;
}

export function CategoryNamingStep({
  images,
  uploading,
  onNameChange,
  onCreateCategories,
  onBack,
  onNext,
  hasExistingCategories,
  error,
}: Props) {
  const categoryInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    categoryInputRefs.current = categoryInputRefs.current.slice(0, images.length);
  }, [images.length]);

  return (
    <div className={styles.stepContent}>
      <h2>Name Each Category</h2>
      <p className={styles.instruction}>
        Give each image a category name (e.g., &quot;Sugar Cookie&quot;, &quot;Chocolate Chip&quot;)
      </p>

      <div className={styles.categoryNameGrid}>
        {images.map((img, index) => {
          const imageKey = img.name || img.preview || `image-${index}`;
          const uniqueKey = `category-${imageKey.slice(-50)}-${index}`;
          return (
            <div key={uniqueKey} className={styles.categoryNameCard}>
              <img src={img.preview} alt={`Category ${index + 1}`} />
              <input
                ref={(el) => {
                  categoryInputRefs.current[index] = el;
                }}
                type="text"
                placeholder={`Category ${index + 1} name`}
                value={img.categoryName || ''}
                onChange={(e) => onNameChange(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextIndex = index + 1;
                    if (nextIndex < images.length && categoryInputRefs.current[nextIndex]) {
                      categoryInputRefs.current[nextIndex]?.focus();
                    }
                  }
                }}
                className={styles.input}
                maxLength={100}
              />
            </div>
          );
        })}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button onClick={onBack} className={styles.buttonSecondary} disabled={uploading}>
          ← Back
        </button>
        {hasExistingCategories && (
          <button onClick={onNext} className={styles.buttonSecondary} disabled={uploading}>
            Next: Add Bakers →
          </button>
        )}
        <button
          onClick={onCreateCategories}
          disabled={uploading || images.some((img) => !img.categoryName?.trim())}
          className={styles.buttonPrimary}
        >
          {uploading
            ? 'Creating...'
            : hasExistingCategories
              ? 'Add More Categories'
              : 'Create Categories'}
        </button>
      </div>
    </div>
  );
}
