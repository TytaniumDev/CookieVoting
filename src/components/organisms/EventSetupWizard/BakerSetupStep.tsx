import React, { useState } from 'react';
import styles from './EventSetupWizard.module.css';

interface Baker {
  id: string;
  name: string;
}

interface Props {
  bakers: Baker[];
  onAddBaker: (name: string) => Promise<void>;
  onRemoveBaker: (id: string) => Promise<void>;
  onBack: () => void;
  onNext: () => void;
  hasExistingCategories: boolean;
  error?: string | null;
}

export function BakerSetupStep({
  bakers,
  onAddBaker,
  onRemoveBaker,
  onBack,
  onNext,
  hasExistingCategories,
  error: parentError,
}: Props) {
  const [newBakerName, setNewBakerName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddBaker = async () => {
    if (!newBakerName.trim()) return;
    try {
      await onAddBaker(newBakerName.trim());
      setNewBakerName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add baker');
    }
  };

  return (
    <div className={styles.stepContent}>
      <h2>Add Bakers</h2>
      <p className={styles.instruction}>List all bakers participating in this event</p>

      <div className={styles.bakerInput}>
        <input
          type="text"
          placeholder="Baker name"
          value={newBakerName}
          onChange={(e) => {
            setNewBakerName(e.target.value);
            setError(null);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddBaker();
            }
          }}
          className={styles.input}
          maxLength={50}
        />
        <button
          onClick={handleAddBaker}
          onMouseDown={(e) => e.preventDefault()}
          className={styles.buttonPrimary}
        >
          Add Baker
        </button>
      </div>

      {(error || parentError) && <div className={styles.error}>{error || parentError}</div>}

      {bakers.length > 0 && (
        <div className={styles.bakerList}>
          {bakers.map((baker) => (
            <div key={baker.id} className={styles.bakerCard}>
              <span>{baker.name}</span>
              <button onClick={() => onRemoveBaker(baker.id)} className={styles.removeButton}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button onClick={onBack} className={styles.buttonSecondary}>
          ← Back
        </button>
        {hasExistingCategories && bakers.length > 0 && (
          <button onClick={onNext} className={styles.buttonSecondary}>
            Next: Tag Cookies →
          </button>
        )}
        <button onClick={onNext} disabled={bakers.length === 0} className={styles.buttonPrimary}>
          {bakers.length > 0 ? 'Continue' : 'Add at least one baker'}
        </button>
      </div>
    </div>
  );
}
