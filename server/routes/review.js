const router = require('express').Router();
const { readData, updateData } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { getTour, presentReview } = require('../utils/domain');

router.get('/', async (req, res, next) => {
  try {
    const tourId = req.query.tourID ? Number(req.query.tourID) : null;
    const data = await readData();
    const reviews = data.reviews
      .filter((entry) => !tourId || entry.tourID === tourId)
      .map((entry) => presentReview(data, entry))
      .sort((left, right) => new Date(right.date) - new Date(left.date));

    return res.json(reviews);
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { tourID, rating, comment } = req.body;
    const numericTourId = Number(tourID);
    const numericRating = Number(rating);
    const data = await readData();

    if (!numericTourId || !numericRating) {
      return res.status(400).json({ error: 'Tour and rating are required.' });
    }

    if (!getTour(data, numericTourId)) {
      return res.status(404).json({ error: 'Tour not found.' });
    }

    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const duplicate = data.reviews.find((entry) => entry.tourID === numericTourId && entry.userID === req.user.id);
    if (duplicate) {
      return res.status(409).json({ error: 'You already reviewed this tour.' });
    }

    const result = await updateData(async (mutableData, helpers) => {
      const review = {
        id: helpers.nextId(mutableData.reviews),
        tourID: numericTourId,
        userID: req.user.id,
        userName: `${req.user.firstName} ${req.user.lastName}`.trim(),
        rating: numericRating,
        comment: String(comment || '').trim(),
        createdAt: helpers.nowIso(),
      };

      mutableData.reviews.unshift(review);
      return { reviewId: review.id };
    });

    const refreshed = await readData();
    const review = refreshed.reviews.find((entry) => entry.id === result.reviewId);
    return res.status(201).json(presentReview(refreshed, review));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
