import { describe, expect, it } from 'vitest';
import { actions, createGalleryState, reducer } from './galleryState';

describe('gallery reducer', () => {
  it('clamps pan within layout bounds', () => {
    const state = createGalleryState({ mode: 'photo' });
    const layout = { width: 1200, height: 2400, columns: 2, tiles: [] };
    const next = reducer(
      state,
      actions.viewportChanged({ viewport: { vw: 1024, vh: 768 }, layout })
    );
    const clamped = reducer(next, actions.pan({ dx: -9999, dy: -9999 }));
    expect(clamped.view.translation.x).toBeGreaterThanOrEqual(layout.width * -1);
  });
});
