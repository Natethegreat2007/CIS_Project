const router = require('express').Router();
const { pool } = require('../db');
const { listTours } = require('../lib/catalog');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/me', requireAuth, requireRole('operator', 'admin'), async (req, res) => {
  res.json({ operator: req.user.operator });
});

router.get('/me/tours', requireAuth, requireRole('operator', 'admin'), async (req, res) => {
  let operatorId = req.user.operator?.id || null;

  if (req.user.role === 'admin' && req.query.operatorId) {
    operatorId = Number(req.query.operatorId);
  }

  if (!operatorId) {
    return res.json({ tours: [] });
  }

  const tours = await listTours(pool, { operatorId });
  res.json({ tours });
});

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `
      SELECT
        operatorID AS id,
        companyName,
        contactEmail,
        phoneNum
      FROM Operator
      ORDER BY companyName ASC
    `
  );

  res.json({ operators: rows });
});

module.exports = router;
