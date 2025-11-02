import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SpyInstance } from 'vitest';
import { getActivePointers, initPointer, subscribePointers, type PointerBatch } from './pointer';

const createPointerEvent = (type: string, init: PointerEventInit & { pointerId: number }) => {
  const baseInit: PointerEventInit = {
    bubbles: true,
    cancelable: true,
    pointerType: 'touch',
    pressure: 0.5,
    isPrimary: true,
    ...init
  };

  if (typeof PointerEvent === 'function') {
    return new PointerEvent(type, baseInit);
  }

  const event = new MouseEvent(type, baseInit);
  const descriptors = {
    pointerId: { value: baseInit.pointerId, configurable: true },
    pointerType: { value: baseInit.pointerType ?? 'mouse', configurable: true },
    pressure: { value: baseInit.pressure ?? 0, configurable: true },
    tangentialPressure: { value: baseInit.tangentialPressure ?? 0, configurable: true },
    twist: { value: baseInit.twist ?? 0, configurable: true },
    width: { value: baseInit.width ?? 0, configurable: true },
    height: { value: baseInit.height ?? 0, configurable: true },
    isPrimary: { value: baseInit.isPrimary ?? false, configurable: true },
    buttons: { value: baseInit.buttons ?? 0, configurable: true }
  };

  Object.defineProperties(event, descriptors);
  return event as unknown as PointerEvent;
};

describe('pointer manager', () => {
  let root: HTMLDivElement;
  let dispose: (() => void) | undefined;
  let now = 0;
  let nowSpy: SpyInstance<[], number>;

  const advance = (ms: number) => {
    now += ms;
  };

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    now = 0;
    nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => now);
    dispose = initPointer(root);
  });

  afterEach(() => {
    dispose?.();
    root.remove();
    nowSpy.mockRestore();
  });

  it('tracks pointer deltas and velocities for a single pointer', () => {
    const batches: PointerBatch[] = [];
    const unsubscribe = subscribePointers((batch) => batches.push(batch));

    root.dispatchEvent(
      createPointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 10,
        clientY: 20,
        buttons: 1
      })
    );

    expect(batches).toHaveLength(1);
    const downBatch = batches[0];
    expect(downBatch.phase).toBe('down');
    expect(downBatch.changed.deltaX).toBe(0);
    expect(downBatch.changed.deltaY).toBe(0);
    expect(downBatch.changed.offsetX).toBe(0);
    expect(downBatch.changed.offsetY).toBe(0);
    expect(downBatch.changed.active).toBe(true);
    expect(downBatch.active).toHaveLength(1);

    advance(16);
    window.dispatchEvent(
      createPointerEvent('pointermove', {
        pointerId: 1,
        clientX: 34,
        clientY: 52,
        buttons: 1
      })
    );

    expect(batches).toHaveLength(2);
    const moveBatch = batches[1];
    expect(moveBatch.phase).toBe('move');
    expect(moveBatch.changed.deltaX).toBe(24);
    expect(moveBatch.changed.deltaY).toBe(32);
    expect(moveBatch.changed.offsetX).toBe(24);
    expect(moveBatch.changed.offsetY).toBe(32);
    expect(moveBatch.changed.velocityX).toBeCloseTo(1500, 5);
    expect(moveBatch.changed.velocityY).toBeCloseTo(2000, 5);
    expect(moveBatch.active).toHaveLength(1);

    advance(16);
    window.dispatchEvent(
      createPointerEvent('pointerup', {
        pointerId: 1,
        clientX: 36,
        clientY: 55,
        buttons: 0
      })
    );

    expect(batches).toHaveLength(3);
    const upBatch = batches[2];
    expect(upBatch.phase).toBe('up');
    expect(upBatch.changed.active).toBe(false);
    expect(upBatch.active).toHaveLength(0);
    expect(getActivePointers()).toHaveLength(0);

    unsubscribe();
  });

  it('maintains multiple active pointers and cleans them individually', () => {
    const phases: PointerBatch['phase'][] = [];
    const counts: number[] = [];
    const unsubscribe = subscribePointers((batch) => {
      phases.push(batch.phase);
      counts.push(batch.active.length);
    });

    root.dispatchEvent(
      createPointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        buttons: 1
      })
    );

    advance(4);
    root.dispatchEvent(
      createPointerEvent('pointerdown', {
        pointerId: 2,
        clientX: 100,
        clientY: 100,
        buttons: 1
      })
    );

    expect(counts).toEqual([1, 2]);

    advance(12);
    window.dispatchEvent(
      createPointerEvent('pointermove', {
        pointerId: 1,
        clientX: 10,
        clientY: 20,
        buttons: 1
      })
    );

    advance(12);
    window.dispatchEvent(
      createPointerEvent('pointerup', {
        pointerId: 1,
        clientX: 10,
        clientY: 20,
        buttons: 0
      })
    );

    advance(12);
    window.dispatchEvent(
      createPointerEvent('pointercancel', {
        pointerId: 2,
        clientX: 110,
        clientY: 110,
        buttons: 0
      })
    );

    expect(phases).toEqual(['down', 'down', 'move', 'up', 'cancel']);
    expect(counts[counts.length - 1]).toBe(0);
    expect(getActivePointers()).toHaveLength(0);

    unsubscribe();
  });

  it('stops emitting batches after pointer listeners are disposed', () => {
    const phases: PointerBatch['phase'][] = [];
    const unsubscribe = subscribePointers((batch) => phases.push(batch.phase));

    root.dispatchEvent(
      createPointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 5,
        clientY: 5,
        buttons: 1
      })
    );
    expect(phases).toEqual(['down']);

    phases.length = 0;
    dispose?.();

    advance(16);
    window.dispatchEvent(
      createPointerEvent('pointermove', {
        pointerId: 1,
        clientX: 15,
        clientY: 25,
        buttons: 1
      })
    );

    expect(phases).toHaveLength(0);
    expect(getActivePointers()).toHaveLength(0);
    unsubscribe();
  });
});
