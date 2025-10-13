<script lang="ts">
  import { onMount } from 'svelte';
  import { Canvas, OrthographicCamera } from '@threlte/core';
  export let row: any;
  // TODO: implement masonry layout, pan/zoom, hit-testing, external open

  let viewport = { width: 1920, height: 1080 };

  onMount(() => {
    const update = () => {
      viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  });
</script>

<Canvas>
  <OrthographicCamera
    makeDefault
    left={0}
    right={viewport.width}
    top={0}
    bottom={viewport.height}
    near={-1000}
    far={1000}
    position={[0, 0, 10]}
  />
  <!-- Gallery content goes here -->
</Canvas>
