import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../useAuthStore';
import * as firebaseAuth from 'firebase/auth';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isLoading: true,
    });
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(true);
    });
  });

  describe('actions', () => {
    it('should handle initialize', () => {
      const unsubscribe = vi.fn();
      vi.mocked(firebaseAuth.onAuthStateChanged).mockReturnValue(unsubscribe);
      
      const { initialize } = useAuthStore.getState();
      const result = initialize();
      
      expect(result).toBe(unsubscribe);
      expect(firebaseAuth.onAuthStateChanged).toHaveBeenCalled();
    });
  });
});
