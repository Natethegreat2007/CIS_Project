const router = require('express').Router();
const { readData } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { presentUser } = require('../utils/domain');

router.get('/', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const data = await readData();
    const users = data.users
      .filter((entry) => entry.active)
      .map((entry) => presentUser(data, entry));

    return res.json(users);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
