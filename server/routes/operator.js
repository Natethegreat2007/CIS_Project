const router = require('express').Router();
const { readData } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', async (_req, res, next) => {
  try {
    const data = await readData();
    const operators = data.operators.map((entry) => ({
      id: entry.id,
      companyName: entry.companyName,
      contactEmail: entry.contactEmail,
      phoneNum: entry.phoneNum,
    }));

    return res.json(operators);
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, requireRole('operator', 'admin'), async (req, res, next) => {
  try {
    const data = await readData();
    const operator = data.operators.find((entry) => entry.id === req.user.operatorId);
    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found.' });
    }

    return res.json(operator);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
