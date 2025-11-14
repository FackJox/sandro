<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';

  export let src: string = '';
  export let alt: string = '';

  const dispatch = createEventDispatcher<{ close: void }>();
  const close = () => dispatch('close');

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };

  onMount(() => document.addEventListener('keydown', onKeyDown));
  onDestroy(() => document.removeEventListener('keydown', onKeyDown));
</script>

<div
  class="backdrop"
  role="dialog"
  aria-modal="true"
  tabindex="0"
  aria-label={alt || 'Image'}
  on:click={close}
  on:keydown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') close(); }}
>
  <div class="modal" on:click|stopPropagation>
    <img src={src} alt={alt} />
    <button class="close" on:click={close} aria-label="Close">✕</button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    display: grid;
    place-items: center;
    z-index: 50;
  }
  .modal { position: relative; max-width: 96vw; max-height: 96vh; }
  img { max-width: 96vw; max-height: 96vh; object-fit: contain; display: block; }
  .close { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); color: #fff; border: 0; padding: 6px 10px; cursor: pointer; }
</style>
