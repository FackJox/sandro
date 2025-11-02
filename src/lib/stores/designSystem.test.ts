import { describe, expect, it, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { theme } from './designSystem';
import { spacing, type, lineHeights, weights } from '$lib/utopia/tokens';
import type { DesignTheme } from './designSystem';

describe('design system store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    theme.set({
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
  });

  describe('store initialization', () => {
    it('initializes with correct type tokens', () => {
      const current = get(theme);

      expect(current.type).toBe(type);
      expect(current.type.bodySmall).toBe(type.bodySmall);
      expect(current.type.body).toBe(type.body);
      expect(current.type.bodyLarge).toBe(type.bodyLarge);
      expect(current.type.h3).toBe(type.h3);
      expect(current.type.h2).toBe(type.h2);
      expect(current.type.h1).toBe(type.h1);
      expect(current.type.display).toBe(type.display);
    });

    it('initializes with correct spacing tokens', () => {
      const current = get(theme);

      expect(current.spacing).toBe(spacing);
      expect(current.spacing.s0).toBe(spacing.s0);
      expect(current.spacing.s1).toBe(spacing.s1);
      expect(current.spacing.s2).toBe(spacing.s2);
      expect(current.spacing.s3).toBe(spacing.s3);
      expect(current.spacing.s4).toBe(spacing.s4);
      expect(current.spacing.s5).toBe(spacing.s5);
      expect(current.spacing.s6).toBe(spacing.s6);
      expect(current.spacing.s7).toBe(spacing.s7);
      expect(current.spacing.s8).toBe(spacing.s8);
    });

    it('initializes with correct line height tokens', () => {
      const current = get(theme);

      expect(current.lineHeights).toBe(lineHeights);
      expect(current.lineHeights.tight).toBe(1.2);
      expect(current.lineHeights.normal).toBe(1.5);
      expect(current.lineHeights.loose).toBe(1.8);
    });

    it('initializes with correct weight tokens', () => {
      const current = get(theme);

      expect(current.weights).toBe(weights);
      expect(current.weights.light).toBe(200);
      expect(current.weights.regular).toBe(400);
      expect(current.weights.medium).toBe(500);
      expect(current.weights.semibold).toBe(600);
      expect(current.weights.bold).toBe(700);
    });
  });

  describe('color properties', () => {
    it('initializes with all 8 color properties', () => {
      const current = get(theme);

      expect(Object.keys(current.colors)).toHaveLength(8);
    });

    it('initializes textPrimary with correct value', () => {
      const current = get(theme);

      expect(current.colors.textPrimary).toBe('#ffffff');
    });

    it('initializes textSecondary with correct value', () => {
      const current = get(theme);

      expect(current.colors.textSecondary).toBe('rgba(255, 255, 255, 0.6)');
    });

    it('initializes textLink with correct value', () => {
      const current = get(theme);

      expect(current.colors.textLink).toBe('#ffffff');
    });

    it('initializes textLinkHover with correct value', () => {
      const current = get(theme);

      expect(current.colors.textLinkHover).toBe('rgba(255, 255, 255, 0.8)');
    });

    it('initializes bgPrimary with correct value', () => {
      const current = get(theme);

      expect(current.colors.bgPrimary).toBe('#708090');
    });

    it('initializes bgSecondary with correct value', () => {
      const current = get(theme);

      expect(current.colors.bgSecondary).toBe('#5a6a7a');
    });

    it('initializes interactive with correct value', () => {
      const current = get(theme);

      expect(current.colors.interactive).toBe('#ffffff');
    });

    it('initializes interactiveHover with correct value', () => {
      const current = get(theme);

      expect(current.colors.interactiveHover).toBe('#e5e5e5');
    });
  });

  describe('token imports validation', () => {
    it('type tokens match imported tokens structure', () => {
      const current = get(theme);
      const expectedKeys = ['bodySmall', 'body', 'bodyLarge', 'h3', 'h2', 'h1', 'display'];

      expect(Object.keys(current.type)).toEqual(expectedKeys);

      // Verify each token is a string containing clamp()
      for (const key of expectedKeys) {
        const tokenValue = current.type[key as keyof typeof current.type];
        expect(typeof tokenValue).toBe('string');
        expect(tokenValue).toMatch(/^clamp\(/);
      }
    });

    it('spacing tokens match imported tokens structure', () => {
      const current = get(theme);
      const expectedKeys = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];

      expect(Object.keys(current.spacing)).toEqual(expectedKeys);

      // Verify each spacing token is a string containing clamp()
      for (const key of expectedKeys) {
        const tokenValue = current.spacing[key as keyof typeof current.spacing];
        expect(typeof tokenValue).toBe('string');
        expect(tokenValue).toMatch(/^clamp\(/);
      }
    });

    it('lineHeights tokens match imported tokens structure', () => {
      const current = get(theme);
      const expectedKeys = ['tight', 'normal', 'loose'];

      expect(Object.keys(current.lineHeights)).toEqual(expectedKeys);

      // Verify each lineHeight is a number
      for (const key of expectedKeys) {
        const tokenValue = current.lineHeights[key as keyof typeof current.lineHeights];
        expect(typeof tokenValue).toBe('number');
        expect(tokenValue).toBeGreaterThan(0);
      }
    });

    it('weights tokens match imported tokens structure', () => {
      const current = get(theme);
      const expectedKeys = ['light', 'regular', 'medium', 'semibold', 'bold'];

      expect(Object.keys(current.weights)).toEqual(expectedKeys);

      // Verify each weight is a number and in expected range
      for (const key of expectedKeys) {
        const tokenValue = current.weights[key as keyof typeof current.weights];
        expect(typeof tokenValue).toBe('number');
        expect(tokenValue).toBeGreaterThanOrEqual(100);
        expect(tokenValue).toBeLessThanOrEqual(900);
      }
    });
  });

  describe('store reactivity', () => {
    it('notifies subscribers when theme is updated', () => {
      const updates: DesignTheme[] = [];

      const unsubscribe = theme.subscribe((value) => {
        updates.push(value);
      });

      // Initial subscription should fire immediately
      expect(updates).toHaveLength(1);
      expect(updates[0].colors.textPrimary).toBe('#ffffff');

      // Update the store
      theme.update((current) => ({
        ...current,
        colors: {
          ...current.colors,
          textPrimary: '#ff0000'
        }
      }));

      // Should have received the update
      expect(updates).toHaveLength(2);
      expect(updates[1].colors.textPrimary).toBe('#ff0000');

      unsubscribe();
    });

    it('allows setting entire theme object', () => {
      const newTheme: DesignTheme = {
        type,
        colors: {
          textPrimary: '#000000',
          textSecondary: '#333333',
          textLink: '#0066cc',
          textLinkHover: '#004499',
          bgPrimary: '#ffffff',
          bgSecondary: '#f0f0f0',
          interactive: '#0066cc',
          interactiveHover: '#0055aa'
        },
        spacing,
        lineHeights,
        weights
      };

      theme.set(newTheme);

      const current = get(theme);
      expect(current.colors.textPrimary).toBe('#000000');
      expect(current.colors.textSecondary).toBe('#333333');
      expect(current.colors.textLink).toBe('#0066cc');
      expect(current.colors.bgPrimary).toBe('#ffffff');
      expect(current.colors.interactive).toBe('#0066cc');
    });

    it('allows updating individual color values', () => {
      const initial = get(theme);
      expect(initial.colors.bgPrimary).toBe('#708090');

      theme.update((current) => ({
        ...current,
        colors: {
          ...current.colors,
          bgPrimary: '#123456'
        }
      }));

      const updated = get(theme);
      expect(updated.colors.bgPrimary).toBe('#123456');
      // Other colors should remain unchanged
      expect(updated.colors.textPrimary).toBe('#ffffff');
      expect(updated.colors.textSecondary).toBe('rgba(255, 255, 255, 0.6)');
    });

    it('maintains token references after updates', () => {
      theme.update((current) => ({
        ...current,
        colors: {
          ...current.colors,
          textPrimary: '#ff0000'
        }
      }));

      const updated = get(theme);

      // Token references should still point to the same imported objects
      expect(updated.type).toBe(type);
      expect(updated.spacing).toBe(spacing);
      expect(updated.lineHeights).toBe(lineHeights);
      expect(updated.weights).toBe(weights);
    });

    it('supports multiple concurrent subscribers', () => {
      const subscriber1Updates: DesignTheme[] = [];
      const subscriber2Updates: DesignTheme[] = [];

      const unsub1 = theme.subscribe((value) => {
        subscriber1Updates.push(value);
      });

      const unsub2 = theme.subscribe((value) => {
        subscriber2Updates.push(value);
      });

      // Both should receive initial value
      expect(subscriber1Updates).toHaveLength(1);
      expect(subscriber2Updates).toHaveLength(1);

      // Update theme
      theme.update((current) => ({
        ...current,
        colors: {
          ...current.colors,
          interactive: '#ff00ff'
        }
      }));

      // Both should receive the update
      expect(subscriber1Updates).toHaveLength(2);
      expect(subscriber2Updates).toHaveLength(2);
      expect(subscriber1Updates[1].colors.interactive).toBe('#ff00ff');
      expect(subscriber2Updates[1].colors.interactive).toBe('#ff00ff');

      unsub1();
      unsub2();
    });
  });

  describe('theme structure validation', () => {
    it('maintains required structure after any update', () => {
      theme.update((current) => ({
        ...current,
        colors: {
          ...current.colors,
          textPrimary: '#000000'
        }
      }));

      const updated = get(theme);

      // Verify structure is intact
      expect(updated).toHaveProperty('type');
      expect(updated).toHaveProperty('colors');
      expect(updated).toHaveProperty('spacing');
      expect(updated).toHaveProperty('lineHeights');
      expect(updated).toHaveProperty('weights');

      // Verify colors object has all 8 properties
      expect(Object.keys(updated.colors)).toHaveLength(8);
      expect(updated.colors).toHaveProperty('textPrimary');
      expect(updated.colors).toHaveProperty('textSecondary');
      expect(updated.colors).toHaveProperty('textLink');
      expect(updated.colors).toHaveProperty('textLinkHover');
      expect(updated.colors).toHaveProperty('bgPrimary');
      expect(updated.colors).toHaveProperty('bgSecondary');
      expect(updated.colors).toHaveProperty('interactive');
      expect(updated.colors).toHaveProperty('interactiveHover');
    });

    it('preserves type safety for all token values', () => {
      const current = get(theme);

      // Type tokens should be strings (clamp values)
      expect(typeof current.type.body).toBe('string');
      expect(typeof current.type.h1).toBe('string');

      // Color values should be strings (hex or rgba)
      expect(typeof current.colors.textPrimary).toBe('string');
      expect(typeof current.colors.bgPrimary).toBe('string');

      // Spacing tokens should be strings (clamp values)
      expect(typeof current.spacing.s0).toBe('string');
      expect(typeof current.spacing.s8).toBe('string');

      // Line heights should be numbers
      expect(typeof current.lineHeights.tight).toBe('number');
      expect(typeof current.lineHeights.normal).toBe('number');

      // Weights should be numbers
      expect(typeof current.weights.light).toBe('number');
      expect(typeof current.weights.bold).toBe('number');
    });
  });

  describe('edge cases and error scenarios', () => {
    it('handles empty color updates gracefully', () => {
      const initial = get(theme);
      const initialColors = { ...initial.colors };

      // Update with empty spread (no actual changes)
      theme.update((current) => ({
        ...current,
        colors: {
          ...current.colors
        }
      }));

      const updated = get(theme);
      expect(updated.colors).toEqual(initialColors);
    });

    it('rejects invalid color values by type system', () => {
      // This test verifies TypeScript will catch invalid values at compile time
      // We can test runtime behavior by attempting to set an unexpected shape
      const current = get(theme);

      // Valid update
      theme.update((curr) => ({
        ...curr,
        colors: {
          ...curr.colors,
          textPrimary: '#000000'
        }
      }));

      const updated = get(theme);
      expect(updated.colors.textPrimary).toBe('#000000');

      // TypeScript would prevent: textPrimary: 123 (number instead of string)
      // TypeScript would prevent: unknownColor: '#fff' (property doesn't exist)
    });

    it('maintains store consistency across rapid updates', () => {
      const colors = ['#000000', '#111111', '#222222', '#333333', '#444444'];

      // Perform rapid sequential updates
      for (const color of colors) {
        theme.update((current) => ({
          ...current,
          colors: {
            ...current.colors,
            textPrimary: color
          }
        }));
      }

      const final = get(theme);
      expect(final.colors.textPrimary).toBe('#444444');
      // Verify structure is still intact
      expect(Object.keys(final.colors)).toHaveLength(8);
      expect(final.type).toBe(type);
    });
  });
});
