export type MasonryItem = { slug: string; aspect: number };
export type Viewport = { vw: number; vh: number };
export type TileRect = { slug: string; x: number; y: number; w: number; h: number };
export type MasonryInput = {
  items: MasonryItem[];
  viewport: Viewport;
  gap: number;
  minColumnWidth: number;
  maxColumns: number;
};
export type MasonryResult = { columns: number; width: number; height: number; tiles: TileRect[] };

export function masonry(config: MasonryInput): MasonryResult {
  const { items, viewport, gap, minColumnWidth, maxColumns } = config;
  const computedColumns = Math.floor(viewport.vw / Math.max(minColumnWidth, 1));
  const columns = Math.max(1, Math.min(maxColumns, computedColumns || 0));

  if (items.length === 0) {
    return { columns, width: 0, height: 0, tiles: [] };
  }

  const columnWidth = columns === 1 ? viewport.vw : (viewport.vw - gap * (columns - 1)) / columns;
  const positions = Array.from({ length: columns }, () => 0);
  const tiles: TileRect[] = [];

  for (const item of items) {
    const columnIndex = positions.indexOf(Math.min(...positions));
    const width = columnWidth;
    const height = width / (item.aspect || 1);
    const x = columnIndex * (width + gap);
    const y = positions[columnIndex];

    tiles.push({ slug: item.slug, x, y, w: width, h: height });
    positions[columnIndex] = y + height + gap;
  }

  const masonryWidth = columns * columnWidth + gap * Math.max(columns - 1, 0);
  const masonryHeight = Math.max(0, Math.max(...positions) - gap);

  return {
    columns,
    width: masonryWidth,
    height: masonryHeight,
    tiles
  };
}
