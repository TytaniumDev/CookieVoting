import React, { useEffect, useState } from 'react';
import { areEmulatorsConnected } from '../src/lib/firebase';

/**
 * Decorator that ensures Firebase emulators are connected before rendering stories
 * This is useful for components that depend on Firebase services
 */
interface WithFirebaseEmulatorProps {
  Story: React.ComponentType;
}

// eslint-disable-next-line react-refresh/only-export-components
const WithFirebaseEmulator: React.FC<WithFirebaseEmulatorProps> = ({ Story }) => {
  const [emulatorReady, setEmulatorReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if emulators are connected
    const checkEmulators = async () => {
      try {
        // Give Firebase a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        const connected = areEmulatorsConnected();
        setEmulatorReady(connected);
        if (!connected) {
          setError('Firebase emulators not connected. Please start emulators with: npm run emulators:start');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check emulator status');
      }
    };

    checkEmulators();
  }, []);

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#ef4444' }}>
        <h3>⚠️ Firebase Emulator Warning</h3>
        <p>{error}</p>
        <p style={{ fontSize: '0.875rem', marginTop: '1rem', opacity: 0.8 }}>
          Some components may not work correctly without emulators running.
        </p>
      </div>
    );
  }

  if (!emulatorReady) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Connecting to Firebase emulators...</p>
      </div>
    );
  }

  return <Story />;
};

export const withFirebaseEmulator = (Story: React.ComponentType) => {
  return <WithFirebaseEmulator Story={Story} />;
};

