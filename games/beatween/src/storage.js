// Remembers the last settings in this browser. Storage can be missing or
// blocked (private mode), so every access is guarded and optional.

const KEY = 'panipuri:beatween:settings';

/** @returns {object | null} raw stored settings (sanitize before use) */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** @param {object} settings */
export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Not saved; nothing else depends on it.
  }
}
