// Tiny DOM helpers. Nothing game-specific belongs here.

/**
 * Create an element.
 * @param {string} tag
 * @param {{class?: string, text?: string, attrs?: object, style?: object, dataset?: object, on?: object}} [props]
 *   `style` accepts CSS custom properties (e.g. {'--t': 0.5}); `on` maps event names to listeners.
 * @param {Array<Node | string | null | false> | Node | string} [children] falsy children are skipped
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.text != null) node.textContent = props.text;
  for (const [name, value] of Object.entries(props.attrs ?? {})) node.setAttribute(name, String(value));
  for (const [name, value] of Object.entries(props.style ?? {})) node.style.setProperty(toCssName(name), String(value));
  Object.assign(node.dataset, props.dataset ?? {});
  for (const [event, listener] of Object.entries(props.on ?? {})) node.addEventListener(event, listener);
  for (const child of [].concat(children)) {
    if (child || child === 0) node.append(child);
  }
  return node;
}

/**
 * Listen for a key anywhere on the page. Ignores auto-repeat and swallows the
 * default action so a focused button doesn't also fire a click.
 * @param {string} key KeyboardEvent.key, e.g. 'Enter'
 * @param {(event: KeyboardEvent) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onKey(key, handler) {
  const listener = (event) => {
    if (event.key !== key || event.repeat) return;
    event.preventDefault();
    handler(event);
  };
  document.addEventListener('keydown', listener);
  return () => document.removeEventListener('keydown', listener);
}

// camelCase → kebab-case; custom properties pass through.
function toCssName(name) {
  return name.startsWith('--') ? name : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * Fill every `[data-value="key"]` inside `root` with `values[key]`. Pages keep
 * a sensible default in the markup, so they read fine without JavaScript.
 * @param {ParentNode} root
 * @param {Record<string, string | number>} values
 */
export function fillValues(root, values) {
  for (const node of root.querySelectorAll('[data-value]')) {
    const value = values[node.dataset.value];
    if (value != null) node.textContent = String(value);
  }
}
