import "@testing-library/jest-dom/vitest";

// Polyfill window.matchMedia for components that use it (e.g. sonner Toaster)
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    })
  });
}

// Node 25 exposes a built-in localStorage that lacks .clear() / .removeItem().
// Replace it with a standard in-memory implementation so tests can call
// window.localStorage.clear() reliably.
const _store: Record<string, string> = {};
const localStorageMock: Storage = {
  get length() { return Object.keys(_store).length; },
  key(index: number) { return Object.keys(_store)[index] ?? null; },
  getItem(key: string) { return Object.prototype.hasOwnProperty.call(_store, key) ? _store[key] : null; },
  setItem(key: string, value: string) { _store[key] = value; },
  removeItem(key: string) { delete _store[key]; },
  clear() { for (const key of Object.keys(_store)) delete _store[key]; }
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });
