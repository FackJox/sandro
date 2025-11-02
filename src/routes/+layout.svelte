<script lang="ts">
  import '../app.css';

  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  import Grid from '$lib/components/Grid.svelte';
  import { api, focus } from '$lib/stores/camera';
  import type { FocusState } from '$lib/stores/camera';
  import { initPointer } from '$lib/controls/pointer';
  import { initShortcuts } from '$lib/controls/shortcuts';
  import { initScroll } from '$lib/controls/scroll';
  import { initGestures } from '$lib/controls/gestures';
  import { createZoomToggle } from '$lib/controls/zoom-toggle';
  import { contactCtaVisible } from '$lib/stores/ui';

  const GRID_STATE_KEY = '__grid_state';
  const navigation = writable<{ to: string; replace?: boolean } | null>(null);

  let root: HTMLDivElement | null = null;
  let navigationToken = 0;
  let gridHistoryActive = false;
  let ctaBusy = false;
  let suppressHistoryPush = false;
  let lastFocusKind: FocusState['kind'] | null = null;

  const setCtaVisibility = (visible: boolean) => {
    console.log('[layout] setCtaVisibility', visible);
    contactCtaVisible.set(visible);
  };

  const pushGridHistory = () => {
    if (typeof window === 'undefined' || gridHistoryActive) return;
    history.pushState({ [GRID_STATE_KEY]: true }, '', window.location.pathname);
    gridHistoryActive = true;
  };

  const clearGridHistory = () => {
    gridHistoryActive = false;
    suppressHistoryPush = false;
  };

  const handleTarget = async (
    target: { kind: 'grid' } | { kind: 'row'; rowSlug: string; tileIndex?: number } | { kind: 'tile'; rowSlug: string; tileSlug: string; tileIndex?: number },
    options: { skipHistory?: boolean } = {}
  ) => {
    const token = ++navigationToken;
    let transitionPromise: Promise<unknown>;

    if (target.kind === 'grid') {
      console.log('[layout] handling grid target');
      transitionPromise = api.zoomOutToGrid();
    } else if (target.kind === 'row') {
      console.log('[layout] handling row target', target.rowSlug);
      transitionPromise = api.focusRow(target.rowSlug, target.tileIndex);
    } else {
      console.log('[layout] handling tile target', target.rowSlug, target.tileSlug);
      transitionPromise = api.focusTile(target.rowSlug, target.tileSlug, target.tileIndex);
    }

    try {
      await transitionPromise;
    } catch (error) {
      console.error('Camera transition failed', error);
      if (target.kind === 'grid' && options.skipHistory) {
        suppressHistoryPush = false;
      }
      return;
    }

    if (token !== navigationToken) return;
    console.log('[layout] target complete', target);

  };

  const handlePopState = (event: PopStateEvent) => {
    console.log('[layout] popstate', event.state);
    if (event.state && event.state[GRID_STATE_KEY]) {
      gridHistoryActive = true;
      void handleTarget({ kind: 'grid' }, { skipHistory: true });
    } else {
      clearGridHistory();
    }
  };

  const handlePageChange = ($page: { data?: any }) => {
    const target = $page.data?.target;
    if (!target) return;
    console.log('[layout] page change ->', target);
    void handleTarget(target);
  };

  const onContactClick = async () => {
    if (ctaBusy) return;
    ctaBusy = true;
    setCtaVisibility(false);
    try {
    await api.focusRow('contact');
    navigation.set({ to: '/contact' });
    } finally {
      ctaBusy = false;
    }
  };

  onMount(() => {
    const zoomToggle = createZoomToggle();
    const disposePointer = root ? initPointer(root) : undefined;
    const disposeScroll = root ? initScroll(root, zoomToggle) : undefined;
    const disposeGestures = initGestures(root, zoomToggle);
    const disposeShortcuts = initShortcuts();
    if (typeof window !== 'undefined') {
      (window as any).__cameraApi = api;
    }
    const unsubNavigateTo = navigation.subscribe(async ($nav) => {
      if ($nav) {
        await goto($nav.to, { replaceState: $nav.replace, noScroll: true, keepFocus: true });
        navigation.set(null);
      }
    });
    const unsubscribe = page.subscribe(handlePageChange);
    const unsubscribeFocus = focus.subscribe(($focus) => {
      if ($focus.kind === lastFocusKind) return;
      lastFocusKind = $focus.kind;
      const isGrid = $focus.kind === 'grid';
      console.log('[layout] focus store update', $focus);
      setCtaVisibility(isGrid);
      if (typeof window !== 'undefined') {
        if (isGrid) {
          if (suppressHistoryPush) {
            suppressHistoryPush = false;
            gridHistoryActive = true;
          } else {
            pushGridHistory();
          }
        } else if (gridHistoryActive) {
          clearGridHistory();
        }
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      disposePointer?.();
      disposeScroll?.();
      disposeGestures?.();
      zoomToggle.dispose();
      disposeShortcuts?.();
      unsubscribe();
      unsubscribeFocus();
      unsubNavigateTo();
      if (typeof window !== 'undefined') {
        if ((window as any).__cameraApi === api) {
          delete (window as any).__cameraApi;
        }
        window.removeEventListener('popstate', handlePopState);
      }
    };
  });
</script>

<style>
  .app {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #001836;
    color: white;
  }
</style>

<div class="app" bind:this={root}>
  <Grid />
  {#if $contactCtaVisible}
    <button class="contact-cta" on:click={onContactClick}>CONTACT</button>
  {/if}
  <slot />
</div>
