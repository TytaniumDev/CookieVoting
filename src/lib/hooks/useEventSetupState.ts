import { useState, useCallback } from 'react';

export type SetupStep = 'upload' | 'categories' | 'bakers' | 'tagging' | 'summary';

interface WizardState {
  step: SetupStep;
  categoryId: string | null;
  detectedCookiesCount: number;
}

export function useEventSetupState(
  initialStep: SetupStep = 'upload',
  initialCategoryId: string | null = null,
) {
  const [state, setState] = useState<WizardState>({
    step: initialStep,
    categoryId: initialCategoryId,
    detectedCookiesCount: 0,
  });

  const setStep = useCallback((step: SetupStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const setCategoryId = useCallback((categoryId: string | null) => {
    setState((prev) => ({ ...prev, categoryId }));
  }, []);

  const setDetectedCookiesCount = useCallback((count: number) => {
    setState((prev) => ({ ...prev, detectedCookiesCount: count }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      switch (prev.step) {
        case 'upload':
          return { ...prev, step: 'categories' };
        case 'categories':
          return { ...prev, step: 'bakers' };
        case 'bakers':
          return { ...prev, step: 'tagging' };
        case 'tagging':
          return { ...prev, step: 'summary' };
        default:
          return prev;
      }
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      switch (prev.step) {
        case 'categories':
          return { ...prev, step: 'upload' };
        case 'bakers':
          return { ...prev, step: 'categories' };
        case 'tagging':
          return { ...prev, step: 'bakers' };
        case 'summary':
          return { ...prev, step: 'tagging' };
        default:
          return prev;
      }
    });
  }, []);

  return {
    ...state,
    setStep,
    setCategoryId,
    setDetectedCookiesCount,
    nextStep,
    prevStep,
  };
}
