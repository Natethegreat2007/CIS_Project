const router = require('express').Router();
const { pool } = require('../db');
const { normalizeAssetPath } = require('../lib/catalog');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/dashboard', requireAuth, requireRole('admin'), async (req, res) => {
  const [[userStats]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM Users WHERE active = TRUE');
  const [[bookingStats]] = await pool.query('SELECT COUNT(*) AS totalBookings FROM Booking');
  const [[tourStats]] = await pool.query('SELECT COUNT(*) AS totalTours FROM Tour');
  const [[attractionStats]] = await pool.query('SELECT COUNT(*) AS totalAttractions FROM Attraction');
  const [[revenueStats]] = await pool.query(
    `
      SELECT COALESCE(SUM(price), 0) AS totalRevenue
      FROM Booking
      WHERE status <> 'Cancelled'
    `
  );

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

  const [[topAttraction]] = await pool.query(
    `
      SELECT
        a.attrID AS id,
        a.title AS name,
        COUNT(b.bookingID) AS bookingCount
      FROM Attraction a
      LEFT JOIN Tour t ON t.attrID = a.attrID
      LEFT JOIN Booking b ON b.tourID = t.tourID AND b.status <> 'Cancelled'
      GROUP BY a.attrID, a.title
      ORDER BY bookingCount DESC, a.title ASC
      LIMIT 1
    `
  );

  const [[topTour]] = await pool.query(
    `
      SELECT
        t.tourID AS id,
        t.title AS name,
        COUNT(b.bookingID) AS bookingCount
      FROM Tour t
      LEFT JOIN Booking b ON b.tourID = t.tourID AND b.status <> 'Cancelled'
      GROUP BY t.tourID, t.title
      ORDER BY bookingCount DESC, t.title ASC
      LIMIT 1
    `
  );

  const [operatorRows] = await pool.query(
    `
      SELECT
        o.operatorID AS id,
        o.companyName AS name,
        COUNT(b.bookingID) AS bookingCount,
        COALESCE(SUM(CASE WHEN b.status <> 'Cancelled' THEN b.price ELSE 0 END), 0) AS revenue
      FROM Operator o
      LEFT JOIN Tour t ON t.operatorID = o.operatorID
      LEFT JOIN Booking b ON b.tourID = t.tourID
      GROUP BY o.operatorID, o.companyName
      ORDER BY bookingCount DESC, revenue DESC, o.companyName ASC
      LIMIT 5
    `
  );

  const [nationalityRows] = await pool.query(
    `
      SELECT
        COALESCE(n.cName, 'Unknown') AS country,
        COUNT(DISTINCT u.userID) AS userCount,
        COUNT(b.bookingID) AS bookingCount
      FROM Users u
      INNER JOIN Role r ON r.roleID = u.roleID
      LEFT JOIN Nationality n ON n.natID = u.natID
      LEFT JOIN Booking b ON b.userID = u.userID AND b.status <> 'Cancelled'
      WHERE u.active = TRUE AND LOWER(r.roleName) = 'tourist'
      GROUP BY COALESCE(n.cName, 'Unknown')
      ORDER BY bookingCount DESC, userCount DESC, country ASC
      LIMIT 6
    `
  );

  const [monthlyRows] = await pool.query(
    `
      SELECT
        DATE_FORMAT(bookingDate, '%Y-%m') AS monthKey,
        COUNT(*) AS bookingCount
      FROM Booking
      WHERE bookingDate >= DATE_SUB(CURRENT_DATE, INTERVAL 11 MONTH)
      GROUP BY DATE_FORMAT(bookingDate, '%Y-%m')
      ORDER BY monthKey ASC
    `
  );

  const [statusRows] = await pool.query(
    `
      SELECT status, COUNT(*) AS total
      FROM Booking
      GROUP BY status
    `
  );

  res.json({
    stats: {
      totalUsers: Number(userStats.totalUsers),
      totalBookings: Number(bookingStats.totalBookings),
      totalTours: Number(tourStats.totalTours),
      totalAttractions: Number(attractionStats.totalAttractions),
      totalRevenue: Number(revenueStats.totalRevenue || 0),
    },
    highlights: {
      topAttraction: topAttraction ? {
        id: topAttraction.id,
        name: topAttraction.name,
        bookings: Number(topAttraction.bookingCount),
      } : null,
      topTour: topTour ? {
        id: topTour.id,
        name: topTour.name,
        bookings: Number(topTour.bookingCount),
      } : null,
    },
    bestOperators: operatorRows.map((row) => ({
      id: row.id,
      name: row.name,
      bookings: Number(row.bookingCount),
      revenue: Number(row.revenue || 0),
    })),
    frequentNationalities: nationalityRows.map((row) => ({
      country: row.country,
      users: Number(row.userCount),
      bookings: Number(row.bookingCount),
    })),
    monthlyBookings: monthlyRows.map((row) => ({
      month: row.monthKey,
      bookings: Number(row.bookingCount),
    })),
    bookingStatusBreakdown: statusRows.map((row) => ({
      status: row.status,
      total: Number(row.total),
    })),
    popularTours: popularRows.map((row) => ({
      id: row.id,
      name: row.name,
      bookings: Number(row.bookingCount),
      img: normalizeAssetPath(row.imagePath, '/images/bluehole.jpg'),
    })),
  });
});

module.exports = router;
