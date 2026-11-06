// PNG export of a page element with html2canvas (loaded on demand).

/**
 * Inline SVG (Recharts) is rasterised from a serialised copy, where CSS
 * variables such as fill="hsl(var(--primary))" no longer resolve. Replace them
 * with the computed colours in html2canvas's cloned document.
 */
function resolveSvgColors(doc: Document) {
  const view = doc.defaultView;
  if (!view) return;
  doc.querySelectorAll<SVGElement>('svg *').forEach((el) => {
    const style = view.getComputedStyle(el);
    for (const attr of ['fill', 'stroke', 'stop-color'] as const) {
      const value = el.getAttribute(attr);
      if (value && value.includes('var(')) {
        el.setAttribute(attr, style.getPropertyValue(attr) || 'currentColor');
      }
    }
    // Text colour comes from CSS classes the serialised SVG loses.
    if (el.tagName.toLowerCase() === 'text' && !el.getAttribute('fill')) {
      el.setAttribute('fill', style.getPropertyValue('fill') || style.color);
    }
  });
}

/** The first opaque background colour at or above `el`. */
function backgroundOf(el: HTMLElement | null): string {
  for (let node = el; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'transparent' && !/rgba\([^)]*,\s*(0|0?\.\d+)\)$/.test(bg)) return bg;
  }
  return '#ffffff';
}

/** Downloads `element` as a PNG; size defaults to its full scroll size. */
export async function exportElementAsPng(
  element: HTMLElement,
  filename: string,
  size?: { width: number; height: number },
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;
  const background = backgroundOf(element);
  const width = size?.width ?? element.scrollWidth;
  const height = size?.height ?? element.scrollHeight;
  const canvas = await html2canvas(element, {
    backgroundColor: background,
    scale: Math.min(2, window.devicePixelRatio || 1) || 1,
    useCORS: true,
    width,
    height,
    windowWidth: Math.max(document.documentElement.clientWidth, width),
    windowHeight: Math.max(document.documentElement.clientHeight, height),
    onclone: (doc) => resolveSvgColors(doc),
  });
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('The browser could not encode the image');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "My Dashboard" -> "My_Dashboard_2026-11-06". */
export function exportFileName(name: string, ext: string): string {
  const base = name.trim().replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'dashboard';
  return `${base}_${new Date().toISOString().slice(0, 10)}.${ext}`;
}
