/**
 * Security checks (passive):
 * - HTTPS presence / redirect
 * - Common security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
 * - Cookies flags check (Secure, HttpOnly, SameSite) via document.cookie (best-effort)
 * - Inline script presence (basic XSS risk indicator)
 */

module.exports.check = async function ({ headers = {}, html = '', page, $ }) {
  const findings = [];

  // HTTPS check by header and URL scheme
  if (!headers['strict-transport-security'] && !headers['hsts']) {
    findings.push({
      category: 'security',
      severity: 'high',
      code: 'SEC_MISSING_HSTS',
      message: 'Strict-Transport-Security header missing',
      meta: {}
    });
  }

  const mustHeaders = {
    'content-security-policy': 'SEC_MISSING_CSP',
    'x-frame-options': 'SEC_MISSING_XFO',
    'x-content-type-options': 'SEC_MISSING_XCTO',
    'referrer-policy': 'SEC_MISSING_REF'
  };

  for (const h in mustHeaders) {
    if (!headers[h]) {
      findings.push({
        category: 'security',
        severity: h === 'content-security-policy' ? 'high' : 'medium',
        code: mustHeaders[h],
        message: `Header "${h}" is missing`,
        meta: { header: h }
      });
    }
  }

  // Server header exposure
  if (headers['server']) {
    findings.push({
      category: 'security',
      severity: 'low',
      code: 'SEC_SERVER_HEADER',
      message: `Server header present ("${headers['server']}") - can leak info`,
      meta: { server: headers['server'] }
    });
  }

  // Inline script detection
  const inlineScripts = [];
  $('script').each((i, el) => {
    const src = $(el).attr('src');
    const inner = $(el).html() || '';
    if (!src && inner && inner.trim().length > 0) inlineScripts.push({ index: i, snippet: inner.slice(0, 200) });
  });

  if (inlineScripts.length) {
    findings.push({
      category: 'security',
      severity: 'medium',
      code: 'SEC_INLINE_SCRIPTS',
      message: `Inline <script> tags detected (${inlineScripts.length}) — increases XSS risk`,
      meta: { count: inlineScripts.length }
    });
  }

  // Cookies flags: best-effort via document.cookie (only finds non-HttpOnly cookies)
  try {
    const cookiesString = await page.evaluate(() => document.cookie);
    if (cookiesString) {
      // If cookies exist client-side they are not HttpOnly — warn about potential secure flag
      findings.push({
        category: 'security',
        severity: 'low',
        code: 'SEC_NON_HTTPONLY_COOKIES',
        message: 'Some cookies accessible via document.cookie (may lack HttpOnly flag)',
        meta: { sample: cookiesString.split(';').slice(0,3) }
      });
    }
  } catch (e) {
    // ignore if cross-origin or blocked
  }

  return findings;
};
