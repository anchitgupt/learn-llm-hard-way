import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a debounced version of `fn` plus a `flush()` that fires any
 * pending call immediately. Used by NotesTab so a pending save is not
 * lost when the tab unmounts.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number
): { call: (...args: A) => void; flush: () => void } {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<A | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const call = useCallback((...args: A) => {
    pendingArgsRef.current = args;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (pendingArgsRef.current) {
        const a = pendingArgsRef.current;
        pendingArgsRef.current = null;
        fnRef.current(...a);
      }
    }, delayMs);
  }, [delayMs]);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingArgsRef.current) {
      const a = pendingArgsRef.current;
      pendingArgsRef.current = null;
      fnRef.current(...a);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { call, flush };
}
