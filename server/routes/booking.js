const router = require('express').Router();
const { pool } = require('../db');
const { ensureAvailabilityForDate } = require('../lib/availability');
const { mapBooking } = require('../lib/catalog');
const { getSeasonMultiplier } = require('../lib/pricing');
const { requireAuth } = require('../middleware/auth');

async function fetchBookingById(connection, bookingId) {
  const [rows] = await connection.query(
    `
      SELECT
        b.bookingID AS id,
        b.userID AS userID,
        b.tourID AS tourID,
        t.title AS tourName,
        a.title AS attraction,
        COALESCE(t.location, a.location) AS location,
        b.tourDate AS tourDate,
        b.personCount AS personCount,
        p.method AS paymentMethod,
        b.price AS total,
        b.seasonLabel AS season,
        b.status AS status,
        b.bookingDate AS bookedAt
      FROM Booking b
      INNER JOIN Tour t ON t.tourID = b.tourID
      INNER JOIN Attraction a ON a.attrID = t.attrID
      LEFT JOIN Payment p ON p.bookingID = b.bookingID
      WHERE b.bookingID = ?
      LIMIT 1
    `,
    [bookingId]
  );

  return rows[0] ? mapBooking(rows[0]) : null;
}

router.get('/mine', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `
      SELECT
        b.bookingID AS id,
        b.userID AS userID,
        b.tourID AS tourID,
        t.title AS tourName,
        a.title AS attraction,
        COALESCE(t.location, a.location) AS location,
        b.tourDate AS tourDate,
        b.personCount AS personCount,
        p.method AS paymentMethod,
        b.price AS total,
        b.seasonLabel AS season,
        b.status AS status,
        b.bookingDate AS bookedAt
      FROM Booking b
      INNER JOIN Tour t ON t.tourID = b.tourID
      INNER JOIN Attraction a ON a.attrID = t.attrID
      LEFT JOIN Payment p ON p.bookingID = b.bookingID
      WHERE b.userID = ?
      ORDER BY b.bookingDate DESC
    `,
    [req.user.id]
  );

  res.json({ bookings: rows.map(mapBooking) });
});

router.post('/', requireAuth, async (req, res) => {
  const { tourID, tourDate, personCount, paymentMethod } = req.body;
  const normalizedDate = `${tourDate || ''}`;
  const seats = Number(personCount);

  if (!tourID || !normalizedDate || !seats || !paymentMethod) {
    return res.status(400).json({ error: 'Tour, date, party size, and payment method are required.' });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (normalizedDate < today) {
    return res.status(400).json({ error: 'Please choose a future date.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [tourRows] = await connection.query(
      `
        SELECT
          t.tourID,
          t.price,
          t.maxCap
        FROM Tour t
        WHERE t.tourID = ?
        LIMIT 1
      `,
      [Number(tourID)]
    );

    if (!tourRows[0]) {
      await connection.rollback();
      return res.status(404).json({ error: 'Tour not found.' });
    }

    const tour = tourRows[0];
    if (seats > Number(tour.maxCap)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Party size exceeds the maximum capacity for this tour.' });
    }

    await ensureAvailabilityForDate(connection, {
      tourId: Number(tourID),
      maxCapacity: Number(tour.maxCap),
      date: normalizedDate,
    });

    const [availabilityRows] = await connection.query(
      `
        SELECT availabilityID, slots
        FROM Availability
        WHERE tourID = ? AND date = ?
        LIMIT 1
        FOR UPDATE
      `,
      [Number(tourID), normalizedDate]
    );

    const availability = availabilityRows[0];
    if (!availability || Number(availability.slots) < seats) {
      await connection.rollback();
      return res.status(409).json({ error: 'That date no longer has enough available slots.' });
    }

    const season = getSeasonMultiplier(normalizedDate);
    const total = Number((Number(tour.price) * seats * season.mult).toFixed(2));

    const [bookingResult] = await connection.query(
      `
        INSERT INTO Booking (userID, tourID, tourDate, personCount, price, seasonLabel, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Confirmed')
      `,
      [req.user.id, Number(tourID), normalizedDate, seats, total, season.label]
    );

    await connection.query(
      'UPDATE Availability SET slots = slots - ? WHERE availabilityID = ?',
      [seats, availability.availabilityID]
    );

    await connection.query(
      `
        INSERT INTO Payment (bookingID, amount, method, success)
        VALUES (?, ?, ?, TRUE)
      `,
      [bookingResult.insertId, total, paymentMethod]
    );

    await connection.commit();

    const booking = await fetchBookingById(pool, bookingResult.insertId);
    return res.status(201).json({ booking });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const bookingId = Number(req.params.id);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
        SELECT bookingID, userID, tourID, tourDate, personCount, status
        FROM Booking
        WHERE bookingID = ?
        LIMIT 1
        FOR UPDATE
      `,
      [bookingId]
    );

    const booking = rows[0];
    if (!booking) {
      await connection.rollback();
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const canManage = booking.userID === req.user.id || req.user.role === 'admin';
    if (!canManage) {
      await connection.rollback();
      return res.status(403).json({ error: 'You can only cancel your own bookings.' });
    }

    if (booking.status === 'Cancelled') {
      await connection.rollback();
      return res.status(400).json({ error: 'That booking is already cancelled.' });
    }

    const [availabilityRows] = await connection.query(
      `
        SELECT availabilityID
        FROM Availability
        WHERE tourID = ? AND date = ?
        LIMIT 1
        FOR UPDATE
      `,
      [booking.tourID, booking.tourDate]
    );

    await connection.query(
      'UPDATE Booking SET status = ? WHERE bookingID = ?',
      ['Cancelled', bookingId]
    );

    if (availabilityRows[0]) {
      await connection.query(
        'UPDATE Availability SET slots = slots + ? WHERE availabilityID = ?',
        [Number(booking.personCount), availabilityRows[0].availabilityID]
      );
    }

    await connection.commit();

    const updatedBooking = await fetchBookingById(pool, bookingId);
    return res.json({ booking: updatedBooking });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

module.exports = router;
