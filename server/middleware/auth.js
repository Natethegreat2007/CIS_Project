const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'tourist-tome-dev-secret';

function signToken(user) {
  return jwt.sign(
    {
      userID: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function mapUser(row) {
  return {
    id: row.userID,
    email: row.email,
    name: `${row.fName} ${row.lName}`.trim(),
    firstName: row.fName,
    lastName: row.lName,
    role: row.roleName.toLowerCase(),
    nationality: row.nationality || '',
    active: Boolean(row.active),
    operator: row.operatorID
      ? {
          id: row.operatorID,
          companyName: row.companyName,
          contactEmail: row.contactEmail,
          phoneNum: row.phoneNum,
        }
      : null,
  };
}

async function findUserById(userId) {
  const [rows] = await pool.query(
    `
      SELECT
        u.userID,
        u.email,
        u.fName,
        u.lName,
        u.active,
        r.roleName,
        n.cName AS nationality,
        o.operatorID,
        o.companyName,
        o.contactEmail,
        o.phoneNum
      FROM Users u
      INNER JOIN Role r ON r.roleID = u.roleID
      LEFT JOIN Nationality n ON n.natID = u.natID
      LEFT JOIN Operator o ON o.userID = u.userID
      WHERE u.userID = ?
      LIMIT 1
    `,
    [userId]
  );

  return rows[0] ? mapUser(rows[0]) : null;
}

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(payload.userID);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Session is no longer valid.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

function requireRole(...roles) {
  const allowed = roles.map((role) => role.toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have access to this resource.' });
    }

    next();
  };
}

module.exports = {
  findUserById,
  mapUser,
  requireAuth,
  requireRole,
  signToken,
};
