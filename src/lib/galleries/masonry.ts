export type Rect = { x: number; y: number; w: number; h: number };

// Very small placeholder masonry function; replace with responsive algo later.
export function masonry(count: number, colWidth: number, gap: number, cols: number): Rect[] {
  const heights = Array(cols).fill(0) as number[];
  const out: Rect[] = [];
  for (let i = 0; i < count; i++) {
    const col = heights.indexOf(Math.min(...heights));
    const x = col * (colWidth + gap);
    const h = colWidth * 0.75; // placeholder aspect
    const y = heights[col];
    out.push({ x, y, w: colWidth, h });
    heights[col] += h + gap;
  }
  return out;
}

