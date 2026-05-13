'use client';
import { useState, useEffect } from 'react';

/**
 * Returns the current visual viewport height in pixels.
 * Shrinks when the software keyboard appears, so dialogs can
 * set maxHeight from this value to stay fully visible.
 */
export function useVisualViewport(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    const update = () => setHeight(vv ? vv.height : window.innerHeight);
    update();
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
      return () => {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      };
    }
  }, []);

  return height;
}
