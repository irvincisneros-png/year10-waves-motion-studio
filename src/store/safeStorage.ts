import type { StateStorage } from 'zustand/middleware';

/**
 * Storage that transparently degrades to in-memory when the browser denies or
 * exhausts localStorage (private mode, quota full, disabled storage). A polite
 * notice is surfaced via `onStorageDegraded` so the app can inform the user
 * instead of crashing. Persistence-failure resilience is a Stage 1 gate.
 */

let degraded = false;
const memory = new Map<string, string>();
const listeners = new Set<(degraded: boolean) => void>();

function markDegraded() {
  if (degraded) return;
  degraded = true;
  for (const l of listeners) l(true);
}

/** Whether storage has fallen back to memory-only for this session. */
export function isStorageDegraded(): boolean {
  return degraded;
}

/** Subscribe to storage-degradation changes. Returns an unsubscribe fn. */
export function onStorageDegraded(cb: (degraded: boolean) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export const safeStorage: StateStorage = {
  getItem: (name) => {
    if (hasLocalStorage()) {
      try {
        return window.localStorage.getItem(name);
      } catch {
        markDegraded();
      }
    }
    return memory.has(name) ? memory.get(name)! : null;
  },
  setItem: (name, value) => {
    if (hasLocalStorage()) {
      try {
        window.localStorage.setItem(name, value);
        return;
      } catch {
        markDegraded();
      }
    }
    memory.set(name, value);
  },
  removeItem: (name) => {
    if (hasLocalStorage()) {
      try {
        window.localStorage.removeItem(name);
        return;
      } catch {
        markDegraded();
      }
    }
    memory.delete(name);
  },
};
