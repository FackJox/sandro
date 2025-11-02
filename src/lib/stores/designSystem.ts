import { writable } from 'svelte/store';
import { spacing, type, lineHeights, weights } from '$lib/utopia/tokens';

export interface DesignTheme {
  type: typeof type;
  colors: {
    textPrimary: string;
    textSecondary: string;
    textLink: string;
    textLinkHover: string;
    bgPrimary: string;
    bgSecondary: string;
    interactive: string;
    interactiveHover: string;
  };
  spacing: typeof spacing;
  weights: typeof weights;
  lineHeights: typeof lineHeights;
}

export const theme = writable<DesignTheme>({
  type,
  colors: {
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textLink: '#ffffff',
    textLinkHover: 'rgba(255, 255, 255, 0.8)',
    bgPrimary: '#708090',
    bgSecondary: '#5a6a7a',
    interactive: '#ffffff',
    interactiveHover: '#e5e5e5'
  },
  spacing,
  lineHeights,
  weights
});
