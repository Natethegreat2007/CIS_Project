const router = require('express').Router();
const { pool } = require('../db');
const { ensureAvailabilityForMonth, ensureAvailabilityForRange, toIsoDateString } = require('../lib/availability');
const { getTourById, listTours } = require('../lib/catalog');
const { requireAuth, requireRole } = require('../middleware/auth');

async function resolveOperatorId(connection, req) {
  if (req.user.role === 'operator') {
    return req.user.operator?.id || null;
  }

  if (req.body.operatorId) {
    return Number(req.body.operatorId);
  }

  const [rows] = await connection.query(
    'SELECT operatorID FROM Operator ORDER BY operatorID ASC LIMIT 1'
  );

  return rows[0]?.operatorID || null;
}

router.get('/', async (req, res) => {
  const tours = await listTours(pool, {
    attractionId: req.query.attractionId ? Number(req.query.attractionId) : null,
    search: req.query.search || '',
  });

  res.json({ tours });
});

router.get('/:id/availability', async (req, res) => {
  const tourId = Number(req.params.id);
  const monthParam = `${req.query.month || ''}`;
  const match = monthParam.match(/^(\d{4})-(\d{2})$/);
  const today = new Date();
  const year = match ? Number(match[1]) : today.getUTCFullYear();
  const month = match ? Number(match[2]) : today.getUTCMonth() + 1;

  const [tourRows] = await pool.query(
    'SELECT tourID, maxCap FROM Tour WHERE tourID = ? LIMIT 1',
    [tourId]
  );

  if (!tourRows[0]) {
    return res.status(404).json({ error: 'Tour not found.' });
  }

  await ensureAvailabilityForMonth(pool, {
    tourId,
    maxCapacity: tourRows[0].maxCap,
    year,
    month,
  });

  const [rows] = await pool.query(
    `
      SELECT date, slots
      FROM Availability
      WHERE tourID = ? AND YEAR(date) = ? AND MONTH(date) = ?
      ORDER BY date ASC
    `,
    [tourId, year, month]
  );

  res.json({
    availability: rows.map((row) => ({
      date: toIsoDateString(new Date(row.date)),
      slots: Number(row.slots),
      available: Number(row.slots) > 0,
    })),
  });
});

router.get('/:id', async (req, res) => {
  const tour = await getTourById(pool, Number(req.params.id));

  if (!tour) {
    return res.status(404).json({ error: 'Tour not found.' });
  }

  res.json({ tour });
});

router.post('/', requireAuth, requireRole('admin', 'operator'), async (req, res) => {
  const {
    attrID,
    name,
    description,
    durationHours,
    price,
    cap,
    location,
    imagePath,
  } = req.body;

  if (!attrID || !name || !description || !durationHours || !price || !cap) {
    return res.status(400).json({ error: 'Attraction, name, description, duration, price, and capacity are required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const operatorId = await resolveOperatorId(connection, req);
    if (!operatorId) {
      await connection.rollback();
      return res.status(400).json({ error: 'This account is not linked to an operator profile yet.' });
    }

    const [attrRows] = await connection.query(
      'SELECT attrID FROM Attraction WHERE attrID = ? LIMIT 1',
      [Number(attrID)]
    );

    if (!attrRows[0]) {
      await connection.rollback();
      return res.status(404).json({ error: 'Linked attraction not found.' });
    }

    const [result] = await connection.query(
      `
        INSERT INTO Tour (attrID, operatorID, title, descr, duration, price, maxCap, location, imagePath)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Number(attrID),
        operatorId,
        name.trim(),
        description.trim(),
        Number(durationHours),
        Number(price),
        Number(cap),
        location ? location.trim() : null,
        imagePath || '/images/tour6.jpg',
      ]
    );

    const today = new Date();
    await ensureAvailabilityForRange(connection, {
      tourId: result.insertId,
      maxCapacity: Number(cap),
      startDate: toIsoDateString(today),
      endDate: toIsoDateString(new Date(Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() + 180
      ))),
    });

    await connection.commit();

    const tour = await getTourById(pool, result.insertId);
    return res.status(201).json({ tour });
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A tour with that name already exists.' });
    }

    throw error;
  } finally {
    connection.release();
  }
});

router.put('/:id', requireAuth, requireRole('admin', 'operator'), async (req, res) => {
  const tourId = Number(req.params.id);
  const {
    attrID,
    name,
    description,
    durationHours,
    price,
    cap,
    location,
    imagePath,
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `
        SELECT t.tourID, t.operatorID
        FROM Tour t
        WHERE t.tourID = ?
        LIMIT 1
      `,
      [tourId]
    );

    if (!existingRows[0]) {
      await connection.rollback();
      return res.status(404).json({ error: 'Tour not found.' });
    }

    if (req.user.role === 'operator' && existingRows[0].operatorID !== req.user.operator?.id) {
      await connection.rollback();
      return res.status(403).json({ error: 'You can only edit your own tours.' });
    }

    await connection.query(
      `
        UPDATE Tour
        SET
          attrID = ?,
          title = ?,
          descr = ?,
          duration = ?,
          price = ?,
          maxCap = ?,
          location = ?,
          imagePath = ?
        WHERE tourID = ?
      `,
      [
        Number(attrID),
        name.trim(),
        description.trim(),
        Number(durationHours),
        Number(price),
        Number(cap),
        location ? location.trim() : null,
        imagePath || null,
        tourId,
      ]
    );

    await connection.commit();

    const tour = await getTourById(pool, tourId);
    return res.json({ tour });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

module.exports = router;
