// persistent.ts — namespaced ("am-") Web Storage helpers with JSON round-trip
// that never throw on corrupt data. LocalStorage variants persist across
// sessions; session variants (s-prefix in the API name) use sessionStorage.

const PREFIX = 'am-';

export function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function setJSON(key: string, value: unknown): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function getStr(key: string, fallback: string): string {
  return localStorage.getItem(PREFIX + key) ?? fallback;
}

export function setStr(key: string, value: string): void {
  localStorage.setItem(PREFIX + key, value);
}

export function getSessionJSON<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function setSessionJSON(key: string, value: unknown): void {
  sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function getSessionStr(key: string, fallback: string): string {
  return sessionStorage.getItem(PREFIX + key) ?? fallback;
}

export function setSessionStr(key: string, value: string): void {
  sessionStorage.setItem(PREFIX + key, value);
}
