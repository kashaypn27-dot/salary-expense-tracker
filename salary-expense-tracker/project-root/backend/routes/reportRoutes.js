const express = require('express');
const { getDashboard, getMonthlyReport, getYearlyReport, exportCsv } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/monthly', getMonthlyReport);
router.get('/yearly', getYearlyReport);
router.get('/csv', exportCsv);

module.exports = router;
