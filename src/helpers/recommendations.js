/**
 * Map common issue codes to human-friendly recommendations.
 * For unknown codes, return a generic suggestion.
 */

const map = {
  'SEC_MISSING_HSTS': 'Enable HSTS header: add Strict-Transport-Security header to enforce HTTPS.',
  'SEC_MISSING_CSP': 'Add Content-Security-Policy header to restrict allowed sources for scripts/styles.',
  'SEC_MISSING_XFO': 'Set X-Frame-Options: DENY or SAMEORIGIN to prevent clickjacking.',
  'SEC_MISSING_XCTO': 'Add X-Content-Type-Options: nosniff to prevent MIME sniffing.',
  'SEC_MISSING_REF': 'Add Referrer-Policy header (e.g., no-referrer-when-downgrade).',
  'SEC_INLINE_SCRIPTS': 'Avoid inline scripts; move JS to external files and use CSP nonces/hashes.',
  'SEC_NON_HTTPONLY_COOKIES': 'Set HttpOnly and Secure flags on sensitive cookies from server side.',
  'PERF_TOO_MANY_REQUESTS': 'Reduce number of resources (combine files, lazy-load images, use bundling).',
  'PERF_NO_COMPRESSION': 'Enable gzip or brotli compression on server for text assets.',
  'PERF_TTFB_HIGH': 'Investigate server response times, CDN and backend performance.',
  'PERF_UNOPTIMIZED_IMAGES': 'Compress and use responsive images (srcset), convert to modern formats like WebP.',
  'PERF_NO_CACHE_HEADERS': 'Serve static assets with Cache-Control headers to leverage browser caching.',
  'SEO_NO_TITLE': 'Add a concise, relevant <title> for each page (<60 characters recommended).',
  'SEO_NO_META_DESC': 'Add a meta description to improve search engine listing and CTR.',
  'SEO_NO_H1': 'Ensure there is a unique H1 heading describing the page content.',
  'SEO_NO_CANONICAL': 'Add <link rel="canonical" href="..."> to avoid duplicate content issues.',
  'SEO_NO_ROBOTS': 'Add a robots.txt file to control crawling instructions.',
  'SEO_NO_SITEMAP': 'Add a sitemap.xml and submit to search engines.',
  'SEO_LOW_ALT': 'Provide descriptive alt attributes for images for SEO and accessibility.',
  'A11Y_CHECK_FAILED': 'Accessibility scan failed — try again or check console for errors.'
};

function recommend(issue) {
  if (!issue || !issue.code) return 'Investigate this issue and apply web best practices.';
  return map[issue.code] || 'Follow standard best practices for this issue (check OWASP, Google Web Fundamentals, WCAG).';
}

module.exports = { recommend };
