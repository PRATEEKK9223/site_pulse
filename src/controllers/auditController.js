const { pool } = require('../config/db');
const scanner = require('../services/scanner');
const path = require('path');
const fs = require('fs');

exports.home = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM scans ORDER BY created_at DESC LIMIT 10');
    res.render('index', { scans: rows });
  } catch (err) {
    console.error(err);
    res.render('index', { scans: [] });
  }
};

exports.startScan = async (req, res) => {
  const url = (req.body.url || '').trim();
  if (!url) return res.redirect('/');

  // Insert scan record
  const [result] = await pool.query('INSERT INTO scans (url,status) VALUES (?,?)', [url, 'running']);
  const scanId = result.insertId;

  // Run scan (blocking for demo) — in production this should be queued
  try {
    await scanner.runScan(scanId, url);
    res.redirect(`/report/${scanId}`);
  } catch (err) {
    console.error('Scan failed', err);
    await pool.query('UPDATE scans SET status=? WHERE id=?', ['error', scanId]);
    res.redirect(`/report/${scanId}`);
  }
};

exports.report = async (req, res) => {
  try {
    const id = req.params.id;
    const [scans] = await pool.query('SELECT * FROM scans WHERE id=?', [id]);
    if (!scans.length) return res.status(404).send('Report not found');
    const scan = scans[0];
    const [issues] = await pool.query('SELECT * FROM issues WHERE scan_id=? ORDER BY created_at DESC', [id]);
    res.render('report', { scan, issues });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.apiScan = async (req, res) => {
  const id = req.params.id;
  try {
    const [scans] = await pool.query('SELECT * FROM scans WHERE id=?', [id]);
    if (!scans.length) return res.status(404).json({ error: 'Not found' });
    const scan = scans[0];
    const [issues] = await pool.query('SELECT * FROM issues WHERE scan_id=?', [id]);
    res.json({ scan, issues });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.downloadPDF = async (req, res) => {
  // Render the report page to a PDF using Puppeteer
  const id = req.params.id;
  const puppeteer = require('puppeteer');
  const baseUrl = `http://localhost:${process.env.PORT || 3000}`;

  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const url = `${baseUrl}/report/${id}`;

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '10mm', right: '10mm' }
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="site-pulse-report-${id}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error', err);
    res.status(500).send('PDF generation failed');
  }
};
