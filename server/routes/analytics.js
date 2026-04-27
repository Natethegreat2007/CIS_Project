const router = require('express').Router();
const { readData } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { buildDashboard } = require('../utils/domain');

router.get('/dashboard', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const data = await readData();
    return res.json(buildDashboard(data));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
