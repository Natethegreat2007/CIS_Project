const router = require('express').Router();
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query(
    `
      SELECT
        u.userID AS id,
        CONCAT(u.fName, ' ', u.lName) AS name,
        u.email,
        r.roleName AS role,
        u.active,
        o.companyName
      FROM Users u
      INNER JOIN Role r ON r.roleID = u.roleID
      LEFT JOIN Operator o ON o.userID = u.userID
      ORDER BY u.createdAt ASC
    `
  );

  res.json({
    users: rows.map((row) => ({
      ...row,
      active: Boolean(row.active),
      role: row.role.toLowerCase(),
    })),
  });
});

module.exports = router;
