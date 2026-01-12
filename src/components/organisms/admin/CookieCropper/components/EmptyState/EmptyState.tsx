// Stub EmptyState component - minimal implementation for testing
export interface EmptyStateProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export function EmptyState({ onFileSelect, isUploading }: EmptyStateProps) {
  return (
    <div data-testid="empty-state">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onFileSelect(e.target.files[0]);
          }
        }}
        disabled={isUploading}
      />
      {isUploading && <div>Uploading...</div>}
    </div>
  );
}

