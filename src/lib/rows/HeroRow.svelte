<script lang="ts">
  import type { Row } from '$lib/content';

  type HeroRowRow = Extract<Row, { type: 'hero' }>;

  export let row: HeroRowRow;

  const rowLabel = row.title ?? row.slug.toUpperCase();

  const logos = [
    { src: '/images/logos/osprey_logo.avif', alt: 'Osprey' },
    { src: '/images/logos/redbull_logo.avif', alt: 'Red Bull' },
    { src: '/images/logos/epictv_logo.avif', alt: 'Epic TV' },
    { src: '/images/logos/netflix_logo.avif', alt: 'Netflix' },
    { src: '/images/logos/bbc_logo.avif', alt: 'BBC' },
    { src: '/images/logos/norface_logo.avif', alt: 'The North Face' },
    { src: '/images/logos/blackcrows_logo.avif', alt: 'Black Crows' },
    { src: '/images/logos/berghaus_logo.avif', alt: 'Berghaus' },
    { src: '/images/logos/fp_logo.avif', alt: 'FP' },
    { src: '/images/logos/scarpa_logo.avif', alt: 'Scarpa' }
  ];
</script>

<style>
  .hero {
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .background-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    animation: kenBurns 20s ease-in-out infinite alternate;
  }

  @keyframes kenBurns {
    0% {
      transform: scale(1) translate(0, 0);
    }
    100% {
      transform: scale(1.1) translate(-2%, -2%);
    }
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5));
    z-index: 1;
  }

  .content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: white;
    padding: 0 2rem;
  }

  .main-logo {
    width: clamp(300px, 50vw, 600px);
    height: auto;
    margin-bottom: clamp(1rem, 3vh, 2rem);
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
  }

  .tagline {
    font-family: 'Fahkwang', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    font-weight: 300;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: clamp(0.5rem, 1.5vh, 1rem);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
  }

  .subtitle {
    font-family: 'Fahkwang', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: clamp(0.9rem, 2vw, 1.25rem);
    font-weight: 200;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
  }

  .brand-logos {
    position: absolute;
    bottom: clamp(2rem, 5vh, 4rem);
    left: 0;
    right: 0;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: clamp(1.5rem, 4vw, 3rem);
    padding: 0 2rem;
    flex-wrap: wrap;
  }

  .brand-logo {
    height: clamp(30px, 5vh, 50px);
    width: auto;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    opacity: 0.95;
    transition: all 0.3s ease;
  }

  .brand-logo:hover {
    opacity: 1;
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    .brand-logos {
      gap: clamp(1rem, 3vw, 1.5rem);
    }

    .brand-logo {
      height: clamp(25px, 4vh, 40px);
    }
  }
</style>

<div class="hero" role="region" aria-label={rowLabel} data-row={row.slug}>
  <div class="background">
    <img
      src="/images/hero/hero_image.avif"
      alt="Mountain landscape with tents"
      class="background-image"
    />
  </div>

  <div class="overlay"></div>

  <div class="content">
    <img
      src="/images/logos/sandro_logo.avif"
      alt="Sandro"
      class="main-logo"
    />

    <div class="tagline">FILM & PHOTO</div>
    <div class="subtitle">HIGH ALTITUDE & HOSTILE ENVIRONMENT</div>
  </div>

  <div class="brand-logos">
    {#each logos as logo}
      <img
        src={logo.src}
        alt={logo.alt}
        class="brand-logo"
      />
    {/each}
  </div>
</div>
