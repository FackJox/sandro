// Utopia-style fluid tokens
export const viewport = { min: 360, max: 1440 };

export const clamp = (minPx: number, vwMin: number, vwMax: number, maxPx: number) => {
  const slope = (maxPx - minPx) / (vwMax - vwMin);
  const yAxisIntersect = minPx - slope * vwMin;
  return `clamp(${minPx}px, ${yAxisIntersect.toFixed(4)}px + ${(slope * 100).toFixed(4)}vw, ${maxPx}px)`;
};

export const type = {
  base: clamp(15, viewport.min, viewport.max, 18)
};

export const spacing = {
  s0: clamp(4, viewport.min, viewport.max, 6),
  s1: clamp(8, viewport.min, viewport.max, 12),
  s2: clamp(12, viewport.min, viewport.max, 16),
  s3: clamp(16, viewport.min, viewport.max, 24),
  s4: clamp(24, viewport.min, viewport.max, 32),
  s5: clamp(32, viewport.min, viewport.max, 48),
  s6: clamp(48, viewport.min, viewport.max, 64),
  s7: clamp(64, viewport.min, viewport.max, 96),
  s8: clamp(96, viewport.min, viewport.max, 128)
};

