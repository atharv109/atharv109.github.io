// In-memory Web Storage shim so persistent.ts runs under vitest's node
// environment without pulling in jsdom (keeps dev deps to the allowed set).

function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, String(value)),
  };
}

Object.defineProperty(globalThis, 'localStorage', { value: makeStorage(), configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: makeStorage(), configurable: true });
