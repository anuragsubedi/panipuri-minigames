// Inline SVG icons (stroke = currentColor), so no image assets are needed.

const PATHS = {
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
  close: '<path d="M7 7l10 10M17 7L7 17"/>',
  trash: '<path d="M5 7h14"/><path d="M9.5 7V5h5v2"/><path d="M7 7l1 12h8l1-12"/>',
  fling: '<circle cx="6" cy="17" r="2.2" fill="currentColor" stroke="none"/><path d="M8.5 14.5L18 5"/><path d="M12.5 5H18v5.5"/>',
};

/**
 * @param {keyof PATHS} name
 * @returns {string} SVG markup (static, trusted)
 */
export function icon(name) {
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name]}</svg>`;
}
