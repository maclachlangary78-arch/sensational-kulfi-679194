import { useEffect, useState } from 'react';

// Small localStorage-backed state for things that should survive switching tabs and app restarts.
// `initial` may be a function so defaults (like a fresh spread) are only built when nothing is stored.
export function useStoredState(key, initial) {
  const [value, setValue] = useState(() => {
    const base = typeof initial === 'function' ? initial() : initial;
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      if (stored === null) return base;
      return base && typeof base === 'object' && !Array.isArray(base) ? { ...base, ...stored } : stored;
    } catch {
      return base;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full (usually queued photos) — keep working from memory.
    }
  }, [key, value]);
  return [value, setValue];
}
