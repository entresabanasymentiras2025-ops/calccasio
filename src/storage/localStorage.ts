const PREFIX = 'casio-emulator-hub:'

export function loadRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

export function saveRaw(key: string, value: string): void {
  try {
    window.localStorage.setItem(PREFIX + key, value)
  } catch {
    // Storage can be unavailable (private browsing, quota exceeded) — persistence
    // is a nice-to-have, never a requirement for the calculator to function.
  }
}

export function loadJSON<T>(key: string): T | null {
  const raw = loadRaw(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveJSON(key: string, value: unknown): void {
  saveRaw(key, JSON.stringify(value))
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}
