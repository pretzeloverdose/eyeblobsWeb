// hooks/usePersistentTransform.ts
import { useState, useEffect } from 'react';

interface TransformState {
  scale: number;
  positionX: number;
  positionY: number;
}

export const usePersistentTransform = (keyPrefix: string = 'default') => {
  const [transformState, setTransformState] = useState<TransformState>(() => {
    if (typeof window === 'undefined') {
      return { scale: 1, positionX: 0, positionY: 0 };
    }
    
    const saved = localStorage.getItem(`${keyPrefix}-transformState`);
    try {
      return saved ? JSON.parse(saved) : { scale: 1, positionX: 0, positionY: 0 };
    } catch {
      return { scale: 1, positionX: 0, positionY: 0 };
    }
  });

  const [opacity, setOpacity] = useState(() => {
    if (typeof window === 'undefined') return 0.5;
    const saved = localStorage.getItem(`${keyPrefix}-opacity`);
    return saved ? parseFloat(saved) : 0.5;
  });

  useEffect(() => {
    localStorage.setItem(`${keyPrefix}-transformState`, JSON.stringify(transformState));
  }, [transformState, keyPrefix]);

  useEffect(() => {
    localStorage.setItem(`${keyPrefix}-opacity`, opacity.toString());
  }, [opacity, keyPrefix]);

  return {
    transformState,
    setTransformState,
    opacity,
    setOpacity
  };
};