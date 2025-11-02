<script lang="ts">
  import type { Row } from '$lib/content';

  type ContactRowRow = Extract<Row, { type: 'contact' }>;

  export let row: ContactRowRow;

  const heading = row.title ?? row.slug.toUpperCase();

  const socials = [
    {
      id: 'youtube',
      label: 'YouTube',
      href: 'https://www.youtube.com/@sandrogh'
    },
    {
      id: 'instagram',
      label: 'Instagram',
      href: 'https://www.instagram.com/sandrogh/'
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/sandro-gromen-hayes'
    }
  ];
</script>

<div class="contact-tile" role="region" aria-labelledby="contact-title" data-row={row.slug}>
  <div class="background">
    <img
      src="/37d07c_f35c49f1cc5d4e9f94afd63a3d47ae12f000.avif"
      alt="Radio device with illuminated display"
      loading="lazy"
    />
  </div>
  <div class="overlay" aria-hidden="true"></div>

  <div class="content">
    <h2 id="contact-title">{heading}</h2>
    <p class="lead">If you have a story to tell please get in touch.</p>
    <a class="contact-link phone" href="tel:+447880352909">+44 7880 352909</a>
    <a class="contact-link email" href="mailto:sandro.gromen-hayes@live.com">
      sandro.gromen-hayes@live.com
    </a>
    <div class="socials" aria-label="Social media links">
      {#each socials as social}
        <a
          class={`social-icon ${social.id}`}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
        >
          {#if social.id === 'youtube'}
            <svg viewBox="0 0 48 48" role="img" aria-hidden="true">
              <title>YouTube</title>
              <path
                fill="#ff0000"
                d="M44.5 12.4a5.58 5.58 0 0 0-3.92-3.95C37.13 7.5 24 7.5 24 7.5s-13.13 0-16.58.95A5.58 5.58 0 0 0 3.5 12.4 58.45 58.45 0 0 0 2.5 24a58.45 58.45 0 0 0 1 11.6 5.58 5.58 0 0 0 3.92 3.95C10.87 40.5 24 40.5 24 40.5s13.13 0 16.58-.95a5.58 5.58 0 0 0 3.92-3.95 58.45 58.45 0 0 0 1-11.6 58.45 58.45 0 0 0-1-11.6Z"
              />
              <path fill="#fff" d="m19.2 31.5 12-7.5-12-7.5Z" />
            </svg>
          {:else if social.id === 'instagram'}
            <svg viewBox="0 0 48 48" role="img" aria-hidden="true">
              <title>Instagram</title>
              <defs>
                <radialGradient id="igGradient" cx="19%" cy="100%" r="120%">
                  <stop offset="0%" stop-color="#fdf497" />
                  <stop offset="30%" stop-color="#fdf497" />
                  <stop offset="45%" stop-color="#fd5949" />
                  <stop offset="60%" stop-color="#d6249f" />
                  <stop offset="90%" stop-color="#285AEB" />
                </radialGradient>
              </defs>
              <path
                fill="url(#igGradient)"
                d="M33.5 5h-19A9.5 9.5 0 0 0 5 14.5v19A9.5 9.5 0 0 0 14.5 43h19A9.5 9.5 0 0 0 43 33.5v-19A9.5 9.5 0 0 0 33.5 5Zm6.5 28.5a6.5 6.5 0 0 1-6.5 6.5h-19a6.5 6.5 0 0 1-6.5-6.5v-19A6.5 6.5 0 0 1 14.5 8h19a6.5 6.5 0 0 1 6.5 6.5Z"
              />
              <path
                fill="#fff"
                d="M24 15a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm0 14.5a5.5 5.5 0 1 1 5.5-5.5 5.5 5.5 0 0 1-5.5 5.5Zm9.9-14.63a2.1 2.1 0 1 1-2.1-2.1 2.1 2.1 0 0 1 2.1 2.1Z"
              />
            </svg>
          {:else}
            <svg viewBox="0 0 48 48" role="img" aria-hidden="true">
              <title>LinkedIn</title>
              <path
                fill="#0a66c2"
                d="M42.2 4H5.8A1.8 1.8 0 0 0 4 5.8v36.4A1.8 1.8 0 0 0 5.8 44h36.4a1.8 1.8 0 0 0 1.8-1.8V5.8A1.8 1.8 0 0 0 42.2 4Z"
              />
              <path
                fill="#fff"
                d="M14.2 37.2h-5v-17h5Zm-2.5-19.2a2.9 2.9 0 1 1 2.9-2.9 2.9 2.9 0 0 1-2.9 2.9ZM40 37.2h-5v-8.8c0-2.1-.7-3.6-2.5-3.6a2.7 2.7 0 0 0-2.5 1.8 3.4 3.4 0 0 0-.2 1.3v9.3h-5v-17h5v2.3a5 5 0 0 1 4.5-2.5c3.3 0 5.7 2.1 5.7 6.7Z"
              />
            </svg>
          {/if}
        </a>
      {/each}
    </div>
  </div>
</div>

<style>
  .contact-tile {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #030712;
    color: white;
    text-transform: none;
  }

  .background,
  .overlay {
    position: absolute;
    inset: 0;
  }

  .background img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.05);
    filter: saturate(0.85) brightness(0.9);
  }

  .overlay {
    background: linear-gradient(160deg, rgba(0, 0, 0, 0.55), rgba(0, 24, 54, 0.9));
  }

  .content {
    position: relative;
    z-index: 1;
    max-width: min(720px, 90vw);
    padding: clamp(1.5rem, 4vw, 3rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: clamp(0.75rem, 2vh, 1.5rem);
  }

  h2 {
    font-size: clamp(2.5rem, 8vw, 4rem);
    font-weight: 500;
    letter-spacing: 0.2em;
  }

  .lead {
    font-size: clamp(1.1rem, 2.5vw, 1.75rem);
    font-weight: 200;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.92);
    max-width: 34ch;
  }

  .contact-link {
    font-size: clamp(1rem, 2vw, 1.35rem);
    letter-spacing: 0.05em;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.88);
    transition: color 0.2s ease;
    position: relative;
  }

  .contact-link:hover,
  .contact-link:focus-visible {
    color: white;
  }

  .phone,
  .email {
    white-space: nowrap;
  }

  .email {
    text-transform: lowercase;
  }

  .socials {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(1.5rem, 3vw, 2.5rem);
    margin-top: clamp(1.5rem, 4vh, 3rem);
  }

  .social-icon {
    width: clamp(48px, 7vw, 64px);
    height: clamp(48px, 7vw, 64px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.35));
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  .social-icon svg {
    width: 100%;
    height: 100%;
  }

  .social-icon:hover,
  .social-icon:focus-visible {
    transform: translateY(-4px) scale(1.04);
    filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.45));
  }

  @media (max-width: 640px) {
    .content {
      gap: clamp(0.5rem, 2vh, 1rem);
    }

    .phone,
    .email {
      white-space: normal;
      word-break: break-word;
    }

    .socials {
      gap: 1.5rem;
    }
  }
</style>
