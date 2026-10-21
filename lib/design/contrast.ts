// יחס ניגודיות לפי WCAG 2.x (relative luminance).

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/** קורא את כל ה-`--color-*` מתוך בלוק ה-@theme של globals.css. */
export function parseThemeColors(css: string): Record<string, string> {
  const theme = css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const colors: Record<string, string> = {};
  for (const [, name, value] of theme.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
    colors[name] = value;
  }
  return colors;
}
