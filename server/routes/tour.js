const router = require('express').Router();
const { readData, updateData } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getAttraction,
  getTour,
  buildAvailability,
  presentTour,
} = require('../utils/domain');

router.get('/', async (req, res, next) => {
  try {
    const attractionId = req.query.attrID ? Number(req.query.attrID) : null;
    const data = await readData();
    const tours = data.tours
      .filter((entry) => !attractionId || entry.attrID === attractionId)
      .map((entry) => presentTour(data, entry));

    return res.json(tours);
  } catch (error) {
    return next(error);
  }
});

router.get('/mine', requireAuth, requireRole('operator', 'admin'), async (req, res, next) => {
  try {
    const data = await readData();
    const operatorId = req.user.operatorId;
    const tours = req.user.role === 'admin'
      ? data.tours
      : data.tours.filter((entry) => entry.operatorID === operatorId);

    return res.json(tours.map((entry) => presentTour(data, entry)));
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/availability', async (req, res, next) => {
  try {
    const tourId = Number(req.params.id);
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const data = await readData();
    const tour = getTour(data, tourId);

    if (!tour) {
      return res.status(404).json({ error: 'Tour not found.' });
    }

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ error: 'A valid year and month are required.' });
    }

    return res.json(buildAvailability(data, tourId, year, month));
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const tourId = Number(req.params.id);
    const data = await readData();
    const tour = getTour(data, tourId);

    if (!tour) {
      return res.status(404).json({ error: 'Tour not found.' });
    }

    return res.json(presentTour(data, tour));
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireAuth, requireRole('operator', 'admin'), async (req, res, next) => {
  try {
    const { attrID, title, description, durationHours, price, maxCap, location, image, color } = req.body;
    const data = await readData();

    if (!attrID || !title || !description || !durationHours || price === undefined || !maxCap) {
      return res.status(400).json({ error: 'Attraction, title, description, duration, price, and capacity are required.' });
    }

    const attraction = getAttraction(data, Number(attrID));
    if (!attraction) {
      return res.status(404).json({ error: 'Linked attraction not found.' });
    }

    if (req.user.role === 'operator' && !req.user.operatorId) {
      return res.status(400).json({ error: 'Your operator profile is incomplete.' });
    }

    const result = await updateData(async (mutableData, helpers) => {
      const tour = {
        id: helpers.nextId(mutableData.tours),
        attrID: Number(attrID),
        operatorID: req.user.role === 'admin' ? Number(req.body.operatorID || req.user.operatorId || 1) : req.user.operatorId,
        title: String(title).trim(),
        description: String(description).trim(),
        durationHours: Number(durationHours),
        price: Number(price),
        maxCap: Number(maxCap),
        image: image || '/images/tour1.jpg',
        color: color || attraction.color,
        location: location ? String(location).trim() : attraction.location,
      };

      mutableData.tours.push(tour);
      return { tourId: tour.id };
    });

    const refreshed = await readData();
    const createdTour = getTour(refreshed, result.tourId);
    return res.status(201).json(presentTour(refreshed, createdTour));
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', requireAuth, requireRole('operator', 'admin'), async (req, res, next) => {
  try {
    const tourId = Number(req.params.id);
    const result = await updateData(async (data) => {
      const tour = data.tours.find((entry) => entry.id === tourId);
      if (!tour) {
        return { error: 'Tour not found.', status: 404 };
      }

      if (req.user.role === 'operator' && tour.operatorID !== req.user.operatorId) {
        return { error: 'You can only edit your own tours.', status: 403 };
      }

      const attraction = getAttraction(data, Number(req.body.attrID || tour.attrID));
      if (!attraction) {
        return { error: 'Linked attraction not found.', status: 404 };
      }

      tour.attrID = Number(req.body.attrID || tour.attrID);
      tour.title = req.body.title ? String(req.body.title).trim() : tour.title;
      tour.description = req.body.description ? String(req.body.description).trim() : tour.description;
      tour.durationHours = req.body.durationHours ? Number(req.body.durationHours) : tour.durationHours;
      tour.price = req.body.price !== undefined ? Number(req.body.price) : tour.price;
      tour.maxCap = req.body.maxCap ? Number(req.body.maxCap) : tour.maxCap;
      tour.location = req.body.location ? String(req.body.location).trim() : tour.location;
      tour.image = req.body.image || tour.image;
      tour.color = req.body.color || tour.color || attraction.color;

      return { tourId: tour.id };
    });

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    const data = await readData();
    const tour = getTour(data, result.tourId);
    return res.json(presentTour(data, tour));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
