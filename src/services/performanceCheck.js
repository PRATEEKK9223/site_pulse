/**
 * Performance checks:
 * - Count requests
 * - Total size (best-effort: we don't fetch content-length for each request here)
 * - Detect missing compression (based on response headers of main document)
 * - TTFB (best-effort via performance.timing if available)
 * Note: For a deep performance scan, Lighthouse would be used — here we implement fast heuristics.
 */

module.exports.check = async function ({ headers = {}, page, requests = [] }) {
  const findings = [];
  const reqCount = requests.length;
  if (reqCount > 120) {
    findings.push({
      category: 'performance',
      severity: 'medium',
      code: 'PERF_TOO_MANY_REQUESTS',
      message: `High number of HTTP requests (${reqCount})`,
      meta: { requests: reqCount }
    });
  }

  const contentEncoding = (headers['content-encoding'] || '').toLowerCase();
  if (!contentEncoding.includes('gzip') && !contentEncoding.includes('br') && !contentEncoding.includes('deflate')) {
    findings.push({
      category: 'performance',
      severity: 'medium',
      code: 'PERF_NO_COMPRESSION',
      message: 'No content compression detected on main response',
      meta: { contentEncoding }
    });
  }

  // Try to get TTFB via navigation timing
  try {
    const ttfb = await page.evaluate(() => {
      if (performance && performance.timing) {
        const t = performance.timing;
        if (t.responseStart && t.requestStart) {
          return t.responseStart - t.requestStart;
        }
      }
      return null;
    });
    if (ttfb && ttfb > 800) {
      findings.push({
        category: 'performance',
        severity: 'medium',
        code: 'PERF_TTFB_HIGH',
        message: `High TTFB: ${ttfb} ms`,
        meta: { ttfb }
      });
    }
  } catch (e) {}

  // Image weight heuristic: check <img> tags without srcset or with large file names
  try {
    const imagesInfo = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(i => ({ src: i.currentSrc || i.src || '', width: i.naturalWidth, height: i.naturalHeight }));
    });
    const unoptimized = imagesInfo.filter(i => i.width > 1200).length;
    if (unoptimized > 5) {
      findings.push({
        category: 'performance',
        severity: 'low',
        code: 'PERF_UNOPTIMIZED_IMAGES',
        message: `Many large images detected (${unoptimized}) — consider responsive images and compression`,
        meta: { countLargeImages: unoptimized }
      });
    }
  } catch (e) {}

  // Check Cache-Control on main response
  if (!headers['cache-control']) {
    findings.push({
      category: 'performance',
      severity: 'low',
      code: 'PERF_NO_CACHE_HEADERS',
      message: 'Cache-Control header not present on main response',
      meta: {}
    });
  } else {
    const cc = headers['cache-control'];
    if (cc.includes('no-store') || cc.includes('no-cache')) {
      findings.push({
        category: 'performance',
        severity: 'low',
        code: 'PERF_CACHE_NONE',
        message: `Cache-Control policy indicates no caching (${cc})`,
        meta: { cacheControl: cc }
      });
    }
  }

  return findings;
};
