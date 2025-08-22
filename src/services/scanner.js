/**
 * High-level scanner orchestration:
 * - Launch Puppeteer
 * - Collect headers, network requests, HTML
 * - Run checks modules (security, performance, seo, accessibility)
 * - Score and store results + issues
 */

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { pool } = require('../config/db');
const securityCheck = require('./securityCheck');
const performanceCheck = require('./performanceCheck');
const seoCheck = require('./seoCheck');
const accessibilityCheck = require('./accessibilityCheck');
const { computeScores } = require('../helpers/scoring');
const { recommend } = require('../helpers/recommendations');

const PAGE_LOAD_TIMEOUT = parseInt(process.env.PAGE_LOAD_TIMEOUT || '30000', 10);
const MAX_REQUESTS = parseInt(process.env.MAX_REQUESTS || '150', 10);

async function runScan(scanId, url) {
  const normalizedUrl = normalizeUrl(url);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(PAGE_LOAD_TIMEOUT);

  const requests = [];
  page.on('requestfinished', req => {
    try {
      const resource = {
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType()
      };
      requests.push(resource);
    } catch (e) {}
  });

  let mainResponse;
  try {
    mainResponse = await page.goto(normalizedUrl, { waitUntil: 'networkidle2', timeout: PAGE_LOAD_TIMEOUT });
  } catch (err) {
    console.error('Page load failed', err.message);
    await pool.query('UPDATE scans SET status=? WHERE id=?', ['error', scanId]);
    await browser.close();
    throw err;
  }

  const headers = mainResponse.headers ? mainResponse.headers() : {};
  const html = await page.content();
  const $ = cheerio.load(html);

  // Run module checks
  const securityFindings = await securityCheck.check({ headers, html, page, $ });
  const performanceFindings = await performanceCheck.check({ headers, page, requests });
  const seoFindings = await seoCheck.check({ $, normalizedUrl });
  const accessibilityFindings = await accessibilityCheck.check(page);

  // Combine
  const allFindings = [
    ...securityFindings,
    ...performanceFindings,
    ...seoFindings,
    ...accessibilityFindings
  ];

  // Compute scores
  const scores = computeScores({
    findings: allFindings,
    counts: {
      requests: requests.length
    }
  });

  // Update scans table
  const overall = Math.round((scores.security + scores.performance + scores.seo + scores.a11y) / 4);
  await pool.query(
    'UPDATE scans SET status=?, score_security=?, score_performance=?, score_seo=?, score_a11y=?, overall_score=? WHERE id=?',
    ['done', scores.security, scores.performance, scores.seo, scores.a11y, overall, scanId]
  );

  // Save issues
  for (const f of allFindings) {
    const rec = recommend(f);
    await pool.query(
      'INSERT INTO issues (scan_id, category, severity, code, message, recommendation, meta) VALUES (?,?,?,?,?,?,?)',
      [scanId, f.category, f.severity, f.code || null, f.message || '', rec, JSON.stringify(f.meta || {})]
    );
  }

  await browser.close();
}

function normalizeUrl(u) {
  if (!/^https?:\/\//i.test(u)) return 'https://' + u;
  return u;
}

module.exports = { runScan };
