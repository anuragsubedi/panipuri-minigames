// SVG dot field. Dots come in unit-square coordinates.

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @param {{dots: Array<{x: number, y: number}>, radius: number, label?: string}} options
 * @returns {SVGSVGElement}
 */
export function createField({ dots, radius, label }) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'field');
  svg.setAttribute('viewBox', '0 0 1 1');
  if (label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }
  for (const { x, y } of dots) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(x));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', String(radius));
    svg.append(circle);
  }
  return svg;
}
