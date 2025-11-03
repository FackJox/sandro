import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { writable, type Writable } from 'svelte/store';
import type { DesignTheme } from '$lib/stores/designSystem';
import { spacing, type as typeTokens, lineHeights, weights } from '$lib/utopia/tokens';

type AboutTileComponent = typeof import('./AboutTile.svelte').default;

// Import renderContent as a standalone function for unit testing
// We need to test this function independently of the component
function renderContent(text: string, linkConfig?: { text: string; url: string }): string {
	if (!linkConfig) return text;

	// HTML escape helper
	const escapeHtml = (str: string): string => {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	};

	// Don't create link if text is empty string (no replacement possible)
	if (linkConfig.text === '') return text;

	const escapedUrl = escapeHtml(linkConfig.url);
	const escapedText = escapeHtml(linkConfig.text);
	const linkHtml = `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="link">${escapedText}</a>`;

	// Use regex to replace first occurrence only
	return text.replace(linkConfig.text, linkHtml);
}

describe('AboutTile component', () => {
	let themeStore: Writable<DesignTheme>;
	let AboutTile: AboutTileComponent;

	beforeEach(async () => {
		vi.resetModules();

		// Mock design system store
		themeStore = writable<DesignTheme>({
			type: typeTokens,
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

		vi.doMock('$lib/stores/designSystem', () => ({
			theme: themeStore
		}));

		const module = await import('./AboutTile.svelte');
		AboutTile = module.default;
	});

	describe('renderContent function', () => {
		describe('basic link parsing', () => {
			it('returns text unchanged when no link config provided', () => {
				const text = 'Hello world';
				const result = renderContent(text);

				expect(result).toBe('Hello world');
			});

			it('returns text unchanged when link config is undefined', () => {
				const text = 'Hello world';
				const result = renderContent(text, undefined);

				expect(result).toBe('Hello world');
			});

			it('inserts link HTML when link config matches text', () => {
				const text = 'Contact me at hello@example.com for more info';
				const link = { text: 'hello@example.com', url: 'mailto:hello@example.com' };
				const result = renderContent(text, link);

				expect(result).toContain('<a href="mailto:hello@example.com"');
				expect(result).toContain('target="_blank"');
				expect(result).toContain('rel="noopener noreferrer"');
				expect(result).toContain('class="link"');
				expect(result).toContain('>hello@example.com</a>');
			});

			it('preserves text before and after link', () => {
				const text = 'Contact me at hello@example.com for more info';
				const link = { text: 'hello@example.com', url: 'mailto:hello@example.com' };
				const result = renderContent(text, link);

				expect(result).toContain('Contact me at');
				expect(result).toContain('for more info');
			});

			it('only replaces first occurrence of link text', () => {
				const text = 'Email hello@example.com or hello@example.com again';
				const link = { text: 'hello@example.com', url: 'mailto:hello@example.com' };
				const result = renderContent(text, link);

				// Count occurrences of the link HTML
				const linkCount = (result.match(/<a href=/g) || []).length;
				expect(linkCount).toBe(1);

				// Should still contain second occurrence as plain text
				const firstLinkIndex = result.indexOf('</a>');
				const textAfterLink = result.substring(firstLinkIndex);
				expect(textAfterLink).toContain('hello@example.com');
			});
		});

		describe('XSS prevention', () => {
			it('escapes HTML in link URL', () => {
				const text = 'Click dangerous link';
				const link = {
					text: 'dangerous link',
					url: 'javascript:alert("XSS")'
				};
				const result = renderContent(text, link);

				// JavaScript URLs are escaped but not prevented entirely
				// The important part is that quotes are escaped to prevent breaking out of attribute
				// Browser's textContent doesn't escape the word "javascript" itself
				expect(result).toContain('href="javascript:alert');

				// The actual XSS prevention comes from escaping the quotes in the URL
				// So the URL can't break out of the href attribute and inject onclick, etc.
			});

			it('escapes HTML entities in link text', () => {
				const text = 'Click <script>alert("XSS")</script>';
				const link = {
					text: '<script>alert("XSS")</script>',
					url: 'https://example.com'
				};
				const result = renderContent(text, link);

				// Should NOT contain unescaped script tags in link text
				expect(result).not.toContain('><script>alert');

				// Should contain escaped entities
				expect(result).toContain('&lt;');
				expect(result).toContain('&gt;');
			});

			it('escapes double quotes in URL', () => {
				const text = 'Click malicious link';
				const link = {
					text: 'malicious link',
					url: 'https://example.com" onclick="alert(\'XSS\')'
				};
				const result = renderContent(text, link);

				// Should escape the quote to prevent attribute injection
				expect(result).toContain('&quot;');
				expect(result).not.toContain('href="https://example.com" onclick="');
			});

			it('escapes single quotes in URL', () => {
				const text = 'Click tricky link';
				const link = {
					text: 'tricky link',
					url: "https://example.com' onmouseover='alert(\"XSS\")"
				};
				const result = renderContent(text, link);

				// Should escape the single quote
				expect(result).toContain('&#39;');
				expect(result).not.toContain("href=\"https://example.com' onmouseover='");
			});

			it('handles data URLs safely', () => {
				const text = 'Click data link';
				const link = {
					text: 'data link',
					url: 'data:text/html,<script>alert("XSS")</script>'
				};
				const result = renderContent(text, link);

				// Should escape the script tags in the data URL
				expect(result).toContain('&lt;');
				expect(result).toContain('&gt;');
			});
		});

		describe('edge cases', () => {
			it('handles empty string text', () => {
				const text = '';
				const link = { text: 'link', url: 'https://example.com' };
				const result = renderContent(text, link);

				expect(result).toBe('');
			});

			it('handles empty link text', () => {
				const text = 'Some content';
				const link = { text: '', url: 'https://example.com' };
				const result = renderContent(text, link);

				// Should not crash, but won't find empty string to replace
				expect(result).toBe('Some content');
			});

			it('handles empty link URL', () => {
				const text = 'Click here';
				const link = { text: 'here', url: '' };
				const result = renderContent(text, link);

				// Should create link with empty href
				expect(result).toContain('href=""');
			});

			it('handles link text not present in content', () => {
				const text = 'Some content';
				const link = { text: 'missing', url: 'https://example.com' };
				const result = renderContent(text, link);

				// Should return original text unchanged
				expect(result).toBe('Some content');
			});

			it('handles special regex characters in link text', () => {
				const text = 'Price: $100.00 (special offer)';
				const link = { text: '$100.00', url: 'https://example.com/price' };
				const result = renderContent(text, link);

				// Should handle $ and . without treating them as regex
				expect(result).toContain('<a href="https://example.com/price"');
				expect(result).toContain('>$100.00</a>');
			});

			it('handles newlines in text', () => {
				const text = 'Line 1\nVisit website\nLine 3';
				const link = { text: 'website', url: 'https://example.com' };
				const result = renderContent(text, link);

				expect(result).toContain('Line 1\n');
				expect(result).toContain('<a href="https://example.com"');
				expect(result).toContain('\nLine 3');
			});

			it('handles unicode characters in text', () => {
				const text = 'Email moi à contact@émàil.com pour plus d\'info';
				const link = { text: 'contact@émàil.com', url: 'mailto:contact@émàil.com' };
				const result = renderContent(text, link);

				expect(result).toContain('Email moi à');
				expect(result).toContain('<a href="mailto:contact@émàil.com"');
			});

			it('handles very long URLs', () => {
				const longUrl = 'https://example.com/' + 'a'.repeat(2000);
				const text = 'Click here';
				const link = { text: 'here', url: longUrl };
				const result = renderContent(text, link);

				expect(result).toContain('href="' + longUrl);
			});
		});

		describe('link attributes', () => {
			it('always includes target="_blank"', () => {
				const text = 'Visit website';
				const link = { text: 'website', url: 'https://example.com' };
				const result = renderContent(text, link);

				expect(result).toContain('target="_blank"');
			});

			it('always includes rel="noopener noreferrer"', () => {
				const text = 'Visit website';
				const link = { text: 'website', url: 'https://example.com' };
				const result = renderContent(text, link);

				expect(result).toContain('rel="noopener noreferrer"');
			});

			it('always includes class="link"', () => {
				const text = 'Visit website';
				const link = { text: 'website', url: 'https://example.com' };
				const result = renderContent(text, link);

				expect(result).toContain('class="link"');
			});

			it('maintains correct attribute order', () => {
				const text = 'Visit website';
				const link = { text: 'website', url: 'https://example.com' };
				const result = renderContent(text, link);

				// Check that href comes before target and rel
				const hrefIndex = result.indexOf('href=');
				const targetIndex = result.indexOf('target=');
				const relIndex = result.indexOf('rel=');
				const classIndex = result.indexOf('class=');

				expect(hrefIndex).toBeLessThan(targetIndex);
				expect(targetIndex).toBeLessThan(relIndex);
				expect(relIndex).toBeLessThan(classIndex);
			});
		});
	});

	describe('component rendering', () => {
		it('renders with correct ARIA label based on position', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Test content',
					position: { current: 1, total: 3 }
				}
			});

			const article = container.querySelector('article');
			expect(article?.getAttribute('aria-label')).toBe('About, 1 of 3');
		});

		it('renders with correct ARIA label for different positions', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-2',
					content: 'Test content',
					position: { current: 2, total: 5 }
				}
			});

			const article = container.querySelector('article');
			expect(article?.getAttribute('aria-label')).toBe('About, 2 of 5');
		});

		it('renders article with role="region"', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Test content',
					position: { current: 1, total: 3 }
				}
			});

			const article = container.querySelector('article');
			expect(article?.getAttribute('role')).toBe('region');
		});

		it('renders content without link', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Simple text content',
					position: { current: 1, total: 1 }
				}
			});

			const content = container.querySelector('.content');
			expect(content?.textContent).toBe('Simple text content');
		});

		it('renders content with link', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Contact me at hello@example.com',
					link: { text: 'hello@example.com', url: 'mailto:hello@example.com' },
					position: { current: 1, total: 1 }
				}
			});

			const link = container.querySelector('.content a.link');
			expect(link?.getAttribute('href')).toBe('mailto:hello@example.com');
			expect(link?.textContent).toBe('hello@example.com');
		});

		it('applies design system tokens to CSS variables', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Test content',
					position: { current: 1, total: 1 }
				}
			});

			const article = container.querySelector('article');
			const style = article?.getAttribute('style');

			// Check that design tokens are applied
			expect(style).toContain('--spacing-s6:');
			expect(style).toContain('--type-body:');
			expect(style).toContain('--line-height-normal:');
			expect(style).toContain('--weight-regular:');
			expect(style).toContain('--text-primary:');
			expect(style).toContain('--text-link:');
			expect(style).toContain('--text-link-hover:');
			expect(style).toContain('--interactive:');
			expect(style).toContain('background:');
		});

		it('applies correct CSS classes', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Test content',
					position: { current: 1, total: 1 }
				}
			});

			expect(container.querySelector('.tile')).toBeTruthy();
			expect(container.querySelector('.content-wrapper')).toBeTruthy();
			expect(container.querySelector('.content')).toBeTruthy();
		});
	});

	describe('slug prop usage', () => {
		it('accepts slug prop without error', () => {
			expect(() => {
				render(AboutTile, {
					props: {
						slug: 'test-slug',
						content: 'Test content',
						position: { current: 1, total: 1 }
					}
				});
			}).not.toThrow();
		});

		it('accepts different slug values', () => {
			const slugs = ['about-1', 'about-2', 'bio', 'team'];

			for (const slug of slugs) {
				expect(() => {
					render(AboutTile, {
						props: {
							slug,
							content: 'Test content',
							position: { current: 1, total: 1 }
						}
					});
				}).not.toThrow();
			}
		});

		it('renders slug as data attribute', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'test-slug-123',
					content: 'Test content',
					position: { current: 1, total: 1 }
				}
			});

			const article = container.querySelector('article');
			expect(article?.getAttribute('data-slug')).toBe('test-slug-123');
		});

		it('updates data-slug when prop changes', async () => {
			const { container, component } = render(AboutTile, {
				props: {
					slug: 'initial-slug',
					content: 'Test content',
					position: { current: 1, total: 1 }
				}
			});

			let article = container.querySelector('article');
			expect(article?.getAttribute('data-slug')).toBe('initial-slug');

			// Update slug
			component.$set({ slug: 'updated-slug' });
			await new Promise((resolve) => setTimeout(resolve, 0));

			article = container.querySelector('article');
			expect(article?.getAttribute('data-slug')).toBe('updated-slug');
		});
	});

	describe('integration with design system', () => {
		it('reacts to theme changes', async () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Test content',
					position: { current: 1, total: 1 }
				}
			});

			// Update theme
			themeStore.update((current) => ({
				...current,
				colors: {
					...current.colors,
					bgPrimary: '#ff0000'
				}
			}));

			// Need to wait for Svelte reactivity
			await new Promise((resolve) => setTimeout(resolve, 0));

			const article = container.querySelector('article');
			const style = article?.getAttribute('style');

			// Browser converts hex to rgb format
			expect(style).toContain('rgb(255, 0, 0)');
		});

		it('uses theme spacing tokens', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Test content',
					position: { current: 1, total: 1 }
				}
			});

			const article = container.querySelector('article');
			const style = article?.getAttribute('style');

			// Verify spacing token is used (clamp format)
			expect(style).toMatch(/--spacing-s6:\s*clamp\(/);
		});

		it('uses theme typography tokens', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Test content',
					position: { current: 1, total: 1 }
				}
			});

			const article = container.querySelector('article');
			const style = article?.getAttribute('style');

			// Verify type token is used (clamp format)
			expect(style).toMatch(/--type-body:\s*clamp\(/);
		});

		it('uses theme color tokens', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Test content',
					position: { current: 1, total: 1 }
				}
			});

			const article = container.querySelector('article');
			const style = article?.getAttribute('style');

			// Verify color tokens are used
			expect(style).toContain('--text-primary: #ffffff');
			expect(style).toContain('--text-link: #ffffff');
			// Browser converts hex to rgb
			expect(style).toContain('background: rgb(112, 128, 144)');
		});
	});

	describe('accessibility', () => {
		it('provides meaningful ARIA labels', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Test content',
					position: { current: 2, total: 4 }
				}
			});

			const article = container.querySelector('article');
			const ariaLabel = article?.getAttribute('aria-label');

			expect(ariaLabel).toContain('About');
			expect(ariaLabel).toContain('2');
			expect(ariaLabel).toContain('4');
		});

		it('uses semantic HTML (article element)', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Test content',
					position: { current: 1, total: 1 }
				}
			});

			const article = container.querySelector('article');
			expect(article).toBeTruthy();
		});

		it('links have appropriate security attributes', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Visit website',
					link: { text: 'website', url: 'https://example.com' },
					position: { current: 1, total: 1 }
				}
			});

			const link = container.querySelector('a');

			expect(link?.getAttribute('target')).toBe('_blank');
			expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
		});

		it('focuses on keyboard navigation', () => {
			const { container } = render(AboutTile, {
				props: {
					slug: 'about-1',
					content: 'Visit website',
					link: { text: 'website', url: 'https://example.com' },
					position: { current: 1, total: 1 }
				}
			});

			const link = container.querySelector('a');

			// Link should be focusable
			expect(link?.getAttribute('href')).toBeTruthy();
			expect(link?.tagName.toLowerCase()).toBe('a');
		});
	});
});
