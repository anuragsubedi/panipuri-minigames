// Saved systems in this browser. Storage can be missing or blocked (private
// mode), so every access is guarded; saves are validated on load elsewhere.

const KEY = 'panipuri:orbit:saves';

/** @returns {object[]} raw saved snapshots, newest first */
export function loadSaves() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * @param {object[]} saves
 * @returns {boolean} false if the browser refused to store them
 */
export function storeSaves(saves) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saves));
    return true;
  } catch {
    return false;
  }
}
