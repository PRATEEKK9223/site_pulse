const express = require('express');
const router = express.Router();
const controller = require('../controllers/auditController');

// Home & form
router.get('/', controller.home);

// Start scan (synchronous run for demo)
router.post('/scan', controller.startScan);

// Report view
router.get('/report/:id', controller.report);

// Download PDF
router.get('/download/:id', controller.downloadPDF);

// API: fetch scan JSON
router.get('/api/scan/:id', controller.apiScan);

module.exports = router;
