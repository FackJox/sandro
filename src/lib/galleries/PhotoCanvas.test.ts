import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import PhotoCanvas from './PhotoCanvas.svelte';

const makeRow = () => ({
  type: 'photoGallery' as const,
  slug: 'gallery',
  title: 'Gallery',
  items: [
    { slug: 'first', title: 'First Photo', image: '/photos/first.jpg' },
    { slug: 'second', title: 'Second Photo', image: '/photos/second.jpg' }
  ]
});

describe('PhotoCanvas', () => {
  it('shows shimmer until image loads and exits on Escape', async () => {
    const row = makeRow();
    const zoomOut = vi.fn();
    render(PhotoCanvas, {
      row,
      zoomToggle: { zoomOut, restore: vi.fn(), toggle: vi.fn(), getState: vi.fn() }
    });
    expect(screen.getAllByTestId('gallery-tile-skeleton').length).toBeGreaterThan(0);
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(zoomOut).toHaveBeenCalled();
  });
});
