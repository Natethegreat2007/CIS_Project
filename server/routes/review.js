const router = require('express').Router();
const { pool } = require('../db');
const { listReviews, mapReview } = require('../lib/catalog');
const { requireAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const reviews = await listReviews(pool, {
    tourId: req.query.tourID ? Number(req.query.tourID) : null,
    attractionId: req.query.attractionID ? Number(req.query.attractionID) : null,
  });

  res.json({ reviews });
});

router.post('/', requireAuth, async (req, res) => {
  const { tourID, rating, comment } = req.body;
  const score = Number(rating);

  if (!tourID || !score) {
    return res.status(400).json({ error: 'Tour and rating are required.' });
  }

  if (score < 1 || score > 5) {
    return res.status(400).json({ error: 'Ratings must be between 1 and 5.' });
  }

  try {
    const [result] = await pool.query(
      `
        INSERT INTO Review (userID, tourID, rating, comment)
        VALUES (?, ?, ?, ?)
      `,
      [req.user.id, Number(tourID), score, comment ? comment.trim() : '']
    );

    const [rows] = await pool.query(
      `
        SELECT
          r.reviewID AS id,
          r.tourID AS tourID,
          r.userID AS userID,
          CONCAT(u.fName, ' ', u.lName) AS userName,
          r.rating AS rating,
          r.comment AS comment,
          r.createdAt AS date,
          t.title AS tourName
        FROM Review r
        INNER JOIN Users u ON u.userID = r.userID
        INNER JOIN Tour t ON t.tourID = r.tourID
        WHERE r.reviewID = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    return res.status(201).json({ review: mapReview(rows[0]) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'You already reviewed this tour.' });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ error: 'That tour no longer exists.' });
    }

    throw error;
  }
});

module.exports = router;
