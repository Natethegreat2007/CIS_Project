const router = require('express').Router();
const { pool } = require('../db');
const { normalizeAssetPath } = require('../lib/catalog');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/dashboard', requireAuth, requireRole('admin'), async (req, res) => {
  const [[userStats]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM Users WHERE active = TRUE');
  const [[bookingStats]] = await pool.query('SELECT COUNT(*) AS totalBookings FROM Booking');
  const [[tourStats]] = await pool.query('SELECT COUNT(*) AS totalTours FROM Tour');
  const [[attractionStats]] = await pool.query('SELECT COUNT(*) AS totalAttractions FROM Attraction');

  const [popularRows] = await pool.query(
    `
      SELECT
        t.tourID AS id,
        t.title AS name,
        t.imagePath AS imagePath,
        COUNT(b.bookingID) AS bookingCount
      FROM Tour t
      LEFT JOIN Booking b ON b.tourID = t.tourID
      GROUP BY t.tourID, t.title, t.imagePath
      ORDER BY bookingCount DESC, t.title ASC
      LIMIT 4
    `
  );

  res.json({
    stats: {
      totalUsers: Number(userStats.totalUsers),
      totalBookings: Number(bookingStats.totalBookings),
      totalTours: Number(tourStats.totalTours),
      totalAttractions: Number(attractionStats.totalAttractions),
    },
    popularTours: popularRows.map((row) => ({
      id: row.id,
      name: row.name,
      bookings: Number(row.bookingCount),
      img: normalizeAssetPath(row.imagePath, '/images/bluehole.jpg'),
    })),
  });
});

module.exports = router;
