const jwt = require('jsonwebtoken');
const { readData } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'tourist-tome-dev-secret';

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length).trim();
}

function issueToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

async function optionalAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return next();
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const data = await readData();
    const user = data.users.find((entry) => entry.id === payload.userId && entry.active);
    if (user) {
      req.user = user;
    }
    return next();
  } catch (_error) {
    return next();
  }
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const data = await readData();
    const user = data.users.find((entry) => entry.id === payload.userId && entry.active);

    if (!user) {
      return res.status(401).json({ error: 'Your session is no longer valid.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission for this action.' });
    }
    return next();
  };
}

module.exports = {
  issueToken,
  optionalAuth,
  requireAuth,
  requireRole,
};
