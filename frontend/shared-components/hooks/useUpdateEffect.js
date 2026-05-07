import { useEffect, useRef } from 'react';

/**
 * useUpdateEffect – runs the effect only after the first render.
 *
 * @param {Function} effect  The effect callback (can return a cleanup function).
 * @param {Array} deps       Dependency array, just like in useEffect.
 */
export default function useUpdateEffect(effect, deps) {
  const didMount = useRef(false);

  useEffect(() => {
    if (didMount.current) {
      // Subsequent renders → run the effect
      return effect();
    }
    // Initial mount → set the flag and skip
    didMount.current = true;
    // No cleanup on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
