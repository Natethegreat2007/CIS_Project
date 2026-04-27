const router = require('express').Router();
const argon2 = require('argon2');
const rateLimit = require('express-rate-limit');
const { readData, updateData } = require('../db');
const { issueToken, requireAuth } = require('../middleware/auth');
const { presentUser } = require('../utils/domain');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

router.post('/register', async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role = 'tourist',
      nationality,
      companyName,
      businessEmail,
      phoneNum,
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    if (!['tourist', 'operator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid account type.' });
    }

    if (role === 'operator' && !companyName) {
      return res.status(400).json({ error: 'Operators must provide a company name.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedBusinessEmail = normalizeEmail(businessEmail || email);
    const passwordHash = await argon2.hash(String(password));
    const createdAt = new Date().toISOString();

    const result = await updateData(async (data, helpers) => {
      if (data.users.some((entry) => entry.email.toLowerCase() === normalizedEmail)) {
        return { error: 'That email is already registered.', status: 409 };
      }

      const user = {
        id: helpers.nextId(data.users),
        email: normalizedEmail,
        passwordHash,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        role,
        nationality: nationality ? String(nationality).trim() : '',
        active: true,
        createdAt,
        updatedAt: createdAt,
        operatorId: null,
      };

      data.users.push(user);

      if (role === 'operator') {
        const operator = {
          id: helpers.nextId(data.operators),
          userId: user.id,
          companyName: String(companyName).trim(),
          contactEmail: normalizedBusinessEmail,
          phoneNum: phoneNum ? String(phoneNum).trim() : '',
        };
        data.operators.push(operator);
        user.operatorId = operator.id;
      }

      return { userId: user.id };
    });

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    const data = await readData();
    const user = data.users.find((entry) => entry.id === result.userId);
    const token = issueToken(user);

    return res.status(201).json({
      token,
      user: presentUser(data, user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const data = await readData();
    const user = data.users.find((entry) => entry.email.toLowerCase() === normalizedEmail);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Wrong email or password.' });
    }

    const matches = await argon2.verify(user.passwordHash, String(password || ''));
    if (!matches) {
      return res.status(401).json({ error: 'Wrong email or password.' });
    }

    return res.json({
      token: issueToken(user),
      user: presentUser(data, user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !name) {
      return res.status(400).json({ error: 'Google sign-in requires a valid name and email.' });
    }

    let createdUserId = null;

    await updateData(async (data, helpers) => {
      let user = data.users.find((entry) => entry.email.toLowerCase() === normalizedEmail);
      if (!user) {
        const parts = String(name).trim().split(/\s+/);
        const firstName = parts.shift() || 'Google';
        const lastName = parts.join(' ') || 'User';

        user = {
          id: helpers.nextId(data.users),
          email: normalizedEmail,
          passwordHash: await argon2.hash(`google-${Date.now()}`),
          firstName,
          lastName,
          role: 'tourist',
          nationality: '',
          active: true,
          createdAt: helpers.nowIso(),
          updatedAt: helpers.nowIso(),
          operatorId: null,
        };
        data.users.push(user);
      }

      createdUserId = user.id;
    });

    const data = await readData();
    const user = data.users.find((entry) => entry.id === createdUserId);
    return res.json({
      token: issueToken(user),
      user: presentUser(data, user),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const data = await readData();
    const user = data.users.find((entry) => entry.id === req.user.id);
    return res.json({ user: presentUser(data, user) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
