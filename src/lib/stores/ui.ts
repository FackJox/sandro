import { writable } from 'svelte/store';

export const contactCtaVisible = writable(false);

export type FilterCategory = 'all' | 'video' | 'photo' | 'content';

// Controls which rows are visible in the grid.
// Defaults to 'all'. Other values:
// - 'video': filmGallery + showreel
// - 'photo': photoGallery
// - 'content': about + services + contact
export const filterCategory = writable<FilterCategory>('all');
