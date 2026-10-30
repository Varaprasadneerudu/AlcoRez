/**
 * Image optimization utilities for responsive and low-bandwidth mobile loading.
 */

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=400&q=75';

/**
 * Optimizes an image URL for mobile bandwidth by adjusting width and quality parameters.
 * Automatically handles Unsplash CDN query parameters.
 *
 * @param {string|null|undefined} url - Original image URL
 * @param {number} width - Target width in pixels (defaults to 360px for mobile cards)
 * @param {number} quality - Image compression quality (1-100, defaults to 75)
 * @returns {string} Optimized image URL
 */
export function optimizeImageUrl(url, width = 360, quality = 75) {
  if (!url || typeof url !== 'string') {
    return DEFAULT_FALLBACK_IMAGE;
  }

  // Handle Unsplash images
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', String(quality));
      return parsed.toString();
    } catch {
      // If URL parsing fails, regex-replace or append
      return url.replace(/w=\d+/, `w=${width}`).replace(/q=\d+/, `q=${quality}`);
    }
  }

  return url;
}

/**
 * Generates responsive srcset attribute for modern mobile browsers.
 *
 * @param {string|null|undefined} url - Original image URL
 * @param {number[]} widths - List of widths in pixels
 * @returns {string|undefined} SrcSet string or undefined if not optimizable
 */
export function getImageSrcSet(url, widths = [280, 420, 600]) {
  if (!url || !url.includes('images.unsplash.com')) {
    return undefined;
  }

  return widths
    .map((w) => `${optimizeImageUrl(url, w, 75)} ${w}w`)
    .join(', ');
}

