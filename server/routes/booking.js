const router = require('express').Router();
const { readData, updateData } = require('../db');
const { requireAuth } = require('../middleware/auth');
const {
  getTour,
  calculateBookingTotal,
  getRemainingSlots,
  presentBooking,
} = require('../utils/domain');

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const data = await readData();
    const bookings = data.bookings
      .filter((entry) => entry.userID === req.user.id)
      .sort((left, right) => new Date(right.bookedAt) - new Date(left.bookedAt))
      .map((entry) => presentBooking(data, entry));

    return res.json(bookings);
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { tourID, tourDate, personCount, paymentMethod } = req.body;
    const count = Number(personCount);
    const data = await readData();
    const tour = getTour(data, Number(tourID));

    if (!tour || !tourDate || !count || !paymentMethod) {
      return res.status(400).json({ error: 'Tour, date, person count, and payment method are required.' });
    }

    const remainingSlots = getRemainingSlots(data, tour.id, String(tourDate));
    if (remainingSlots < count) {
      return res.status(409).json({ error: `Only ${remainingSlots} spots remain for that date.` });
    }

    const pricing = calculateBookingTotal(tour, count, tourDate);

    const result = await updateData(async (mutableData, helpers) => {
      const booking = {
        id: helpers.nextId(mutableData.bookings),
        userID: req.user.id,
        tourID: tour.id,
        tourDate: String(tourDate),
        personCount: count,
        paymentMethod: String(paymentMethod),
        totalPrice: pricing.total,
        season: pricing.season.label,
        status: 'Confirmed',
        bookedAt: helpers.nowIso(),
      };

      mutableData.bookings.unshift(booking);
      return { bookingId: booking.id };
    });

    const refreshed = await readData();
    const booking = refreshed.bookings.find((entry) => entry.id === result.bookingId);
    return res.status(201).json(presentBooking(refreshed, booking));
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const result = await updateData(async (data) => {
      const booking = data.bookings.find((entry) => entry.id === bookingId);
      if (!booking) {
        return { error: 'Booking not found.', status: 404 };
      }

      if (booking.userID !== req.user.id && req.user.role !== 'admin') {
        return { error: 'You can only cancel your own bookings.', status: 403 };
      }

      booking.status = 'Cancelled';
      return { bookingId };
    });

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    const data = await readData();
    const booking = data.bookings.find((entry) => entry.id === bookingId);
    return res.json(presentBooking(data, booking));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
