import { describe, expect, it } from 'vitest';
import {
  cameraFromCommand,
  commandFromFocus,
  createCameraController
} from './camera-controller';
import type { ControllerConfig } from './camera-controller';
import type { Row } from '$lib/content';

const heroRow: Row = { type: 'hero', slug: 'hero' };

const photoRow: Row = {
  type: 'photoGallery',
  slug: 'photo',
  title: 'Photo',
  items: [{ slug: 'desert', title: 'Desert', image: '/photo/desert.jpg' }]
};

const filmRow: Row = {
  type: 'filmGallery',
  slug: 'film',
  title: 'Film',
  items: [
    {
      slug: 'teaser',
      title: 'Teaser',
      poster: '/film/teaser.jpg',
      externalUrl: 'https://example.com'
    }
  ]
};

const rowsFixture: Row[] = [heroRow, photoRow, filmRow];
const controllerConfig: ControllerConfig = {
  rows: rowsFixture,
  grid: { columns: 3, rows: 2 }
};

describe('camera controller', () => {
  it('derives camera from focus using geometry helpers', () => {
    const focus = { kind: 'row', rowSlug: 'hero' } as const;
    const command = commandFromFocus(focus);
    const camera = cameraFromCommand(command, controllerConfig);
    expect(camera.scale).toBe(1);
  });

  it('transitions from grid to row focus deterministically', () => {
    const controller = createCameraController(controllerConfig, { focus: { kind: 'grid' } });
    const { transition } = controller.issue({ type: 'focusRow', rowSlug: 'hero' });

    expect(transition).not.toBeNull();
    expect(transition?.from.focus.kind).toBe('grid');
    expect(transition?.to.focus.kind).toBe('row');
    expect(transition?.to.focus).toEqual({ kind: 'row', rowSlug: 'hero', tileIndex: undefined });
  });

  it('transitions from row to tile focus and resolves tile index', () => {
    const controller = createCameraController(controllerConfig, {
      focus: { kind: 'row', rowSlug: 'photo' }
    });
    const { transition } = controller.issue({
      type: 'focusTile',
      rowSlug: 'photo',
      tileSlug: 'desert'
    });

    expect(transition).not.toBeNull();
    expect(transition?.from.focus.kind).toBe('row');
    expect(transition?.to.focus.kind).toBe('tile');
    expect(transition?.to.focus).toEqual({
      kind: 'tile',
      rowSlug: 'photo',
      tileSlug: 'desert',
      tileIndex: 0
    });
  });

  it('queues multiple commands and processes them sequentially', () => {
    const controller = createCameraController(controllerConfig, { focus: { kind: 'grid' } });
    controller.enqueue({ type: 'focusRow', rowSlug: 'hero' });
    controller.enqueue({ type: 'focusTile', rowSlug: 'photo', tileSlug: 'desert' });

    const first = controller.step();
    const second = controller.step();

    expect(first?.to.focus.kind).toBe('row');
    expect(second?.to.focus.kind).toBe('tile');
  });

  it('prevents redundant transitions when command matches current focus', () => {
    const controller = createCameraController(controllerConfig, {
      focus: { kind: 'row', rowSlug: 'hero' }
    });

    const { transition } = controller.issue({ type: 'focusRow', rowSlug: 'hero' });
    expect(transition).toBeNull();
  });

  it('skips enqueueing duplicate commands at the tail of the queue', () => {
    const controller = createCameraController(controllerConfig, { focus: { kind: 'grid' } });
    const first = controller.enqueue({ type: 'focusRow', rowSlug: 'hero' });
    const second = controller.enqueue({ type: 'focusRow', rowSlug: 'hero' });

    expect(first.enqueued).toBe(true);
    expect(second.enqueued).toBe(false);
  });

  it('allows zooming out from tile to grid state', () => {
    const controller = createCameraController(controllerConfig, {
      focus: { kind: 'tile', rowSlug: 'photo', tileSlug: 'desert' }
    });

    const { transition } = controller.issue({ type: 'zoomOutToGrid' });
    expect(transition?.to.focus.kind).toBe('grid');
  });
});
