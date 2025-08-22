/**
 * SEO checks using cheerio ($ in scanner)
 * - Title
 * - Meta description
 * - H1 presence
 * - Canonical
 * - Robots.txt and sitemap.xml existence (simple HEAD requests)
 */

const axios = require('axios');

module.exports.check = async function ({ $, normalizedUrl }) {
  const findings = [];

  const title = $('title').text().trim();
  if (!title) {
    findings.push({ category: 'seo', severity: 'high', code: 'SEO_NO_TITLE', message: 'Missing <title> tag', meta: {} });
  } else if (title.length > 60) {
    findings.push({ category: 'seo', severity: 'low', code: 'SEO_LONG_TITLE', message: 'Title is long (>60 chars)', meta: { length: title.length } });
  }

  const desc = $('meta[name="description"]').attr('content');
  if (!desc) findings.push({ category: 'seo', severity: 'medium', code: 'SEO_NO_META_DESC', message: 'Missing meta description', meta: {} });

  const h1 = $('h1').first().text().trim();
  if (!h1) findings.push({ category: 'seo', severity: 'low', code: 'SEO_NO_H1', message: 'Missing H1 tag', meta: {} });

  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) findings.push({ category: 'seo', severity: 'low', code: 'SEO_NO_CANONICAL', message: 'Missing canonical link tag', meta: {} });

  // robots.txt and sitemap.xml simple checks
  try {
    const base = extractBase(normalizedUrl);
    const robotsUrl = base + '/robots.txt';
    const sitemapUrl = base + '/sitemap.xml';
    const r = await axios.head(robotsUrl, { timeout: 5000 }).catch(() => null);
    if (!r || r.status >= 400) {
      findings.push({ category: 'seo', severity: 'low', code: 'SEO_NO_ROBOTS', message: 'robots.txt not found', meta: { robotsUrl } });
    }
    const s = await axios.head(sitemapUrl, { timeout: 5000 }).catch(() => null);
    if (!s || s.status >= 400) {
      findings.push({ category: 'seo', severity: 'low', code: 'SEO_NO_SITEMAP', message: 'sitemap.xml not found', meta: { sitemapUrl } });
    }
  } catch (e) {}

  // image alt coverage
  const imgs = $('img');
  const totalImgs = imgs.length;
  if (totalImgs > 0) {
    let withAlt = 0;
    imgs.each((i, el) => {
      const a = $(el).attr('alt');
      if (a && a.trim()) withAlt++;
    });
    const pct = (withAlt / totalImgs) * 100;
    if (pct < 80) {
      findings.push({ category: 'seo', severity: 'low', code: 'SEO_LOW_ALT', message: `Image alt coverage low (${Math.round(pct)}%)`, meta: { totalImgs, withAlt } });
    }
  }

  return findings;
};

function extractBase(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch (e) {
    return url;
  }
}
