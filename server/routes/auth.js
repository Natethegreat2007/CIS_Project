const argon2 = require('argon2');
const crypto = require('crypto');
const router = require('express').Router();
const { pool } = require('../db');
const { findUserById, requireAuth, signToken } = require('../middleware/auth');

function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { firstName: 'Guest', lastName: 'User' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'User' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

async function getRoleId(connection, roleName) {
  const normalized = `${roleName}`.trim().toLowerCase();
  const lookup = {
    admin: 'Admin',
    operator: 'Operator',
    tourist: 'Tourist',
  };

  const [rows] = await connection.query(
    'SELECT roleID FROM Role WHERE roleName = ? LIMIT 1',
    [lookup[normalized] || 'Tourist']
  );

  return rows[0]?.roleID || 3;
}

async function getNationalityId(connection, nationality) {
  if (!nationality) {
    return null;
  }

  await connection.query(
    `
      INSERT INTO Nationality (cName)
      VALUES (?)
      ON DUPLICATE KEY UPDATE cName = VALUES(cName)
    `,
    [nationality]
  );

  const [rows] = await connection.query(
    'SELECT natID FROM Nationality WHERE cName = ? LIMIT 1',
    [nationality]
  );

  return rows[0]?.natID || null;
}

router.post('/login', async (req, res) => {
  const email = `${req.body.email || ''}`.trim().toLowerCase();
  const password = `${req.body.password || ''}`;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const [rows] = await pool.query(
    `
      SELECT userID, email, passwordHash, active
      FROM Users
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );

  const userRow = rows[0];
  if (!userRow) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }

  if (!userRow.active) {
    return res.status(403).json({ error: 'This account is inactive.' });
  }

  const validPassword = await argon2.verify(userRow.passwordHash, password).catch(() => false);
  if (!validPassword) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }

  const user = await findUserById(userRow.userID);
  const token = signToken(user);
  return res.json({ token, user });
});

router.post('/register', async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    role = 'tourist',
    nationality,
    companyName,
    contactPhone,
    businessEmail,
  } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'First name, last name, email, and password are required.' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const normalizedRole = `${role}`.trim().toLowerCase();
  if (!['admin', 'operator', 'tourist'].includes(normalizedRole)) {
    return res.status(400).json({ error: 'Invalid role selected.' });
  }

  if (normalizedRole === 'operator' && !companyName) {
    return res.status(400).json({ error: 'Company name is required for operators.' });
  }

  const normalizedEmail = `${email}`.trim().toLowerCase();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      'SELECT userID FROM Users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (existing[0]) {
      await connection.rollback();
      return res.status(409).json({ error: 'That email is already registered.' });
    }

    const passwordHash = await argon2.hash(password);
    const roleId = await getRoleId(connection, normalizedRole);
    const natId = await getNationalityId(connection, nationality);

    const [userResult] = await connection.query(
      `
        INSERT INTO Users (email, passwordHash, fName, lName, roleID, natID)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [normalizedEmail, passwordHash, firstName.trim(), lastName.trim(), roleId, natId]
    );

    if (normalizedRole === 'operator') {
      await connection.query(
        `
          INSERT INTO Operator (userID, companyName, contactEmail, phoneNum)
          VALUES (?, ?, ?, ?)
        `,
        [
          userResult.insertId,
          companyName.trim(),
          (businessEmail || normalizedEmail).trim().toLowerCase(),
          contactPhone ? contactPhone.trim() : null,
        ]
      );
    }

    await connection.commit();

    const user = await findUserById(userResult.insertId);
    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'That email or company is already registered.' });
    }

    throw error;
  } finally {
    connection.release();
  }
});

router.post('/google', async (req, res) => {
  const email = `${req.body.email || ''}`.trim().toLowerCase();
  const role = `${req.body.role || 'tourist'}`.trim().toLowerCase();
  const fullName = `${req.body.name || 'Google User'}`;

  if (!email) {
    return res.status(400).json({ error: 'Google login requires an email address.' });
  }

  const [existing] = await pool.query(
    'SELECT userID FROM Users WHERE email = ? LIMIT 1',
    [email]
  );

  let userId = existing[0]?.userID || null;

  if (!userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { firstName, lastName } = splitName(fullName);
      const roleId = await getRoleId(connection, role === 'operator' ? 'tourist' : role);
      const passwordHash = await argon2.hash(`google:${email}:${crypto.randomUUID()}`);

      const [result] = await connection.query(
        `
          INSERT INTO Users (email, passwordHash, fName, lName, roleID, natID)
          VALUES (?, ?, ?, ?, ?, NULL)
        `,
        [email, passwordHash, firstName, lastName, roleId]
      );

      userId = result.insertId;
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  const user = await findUserById(userId);
  const token = signToken(user);
  return res.json({ token, user });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
