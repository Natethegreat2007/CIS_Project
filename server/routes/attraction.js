const router = require('express').Router();
const { readData, updateData } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { presentAttraction } = require('../utils/domain');

router.get('/', async (_req, res, next) => {
  try {
    const data = await readData();
    const attractions = data.attractions.map((entry) => presentAttraction(data, entry));
    return res.json(attractions);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const attractionId = Number(req.params.id);
    const data = await readData();
    const attraction = data.attractions.find((entry) => entry.id === attractionId);

    if (!attraction) {
      return res.status(404).json({ error: 'Attraction not found.' });
    }

    return res.json(presentAttraction(data, attraction));
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, category, price, description, location, image, color } = req.body;

    if (!name || !category || price === undefined || !description) {
      return res.status(400).json({ error: 'Name, category, price, and description are required.' });
    }

    const result = await updateData(async (data, helpers) => {
      const attraction = {
        id: helpers.nextId(data.attractions),
        title: String(name).trim(),
        category: String(category).trim(),
        location: location ? String(location).trim() : 'Belize',
        basePrice: Number(price),
        seedRating: 0,
        image: image || '/images/beach.jpg',
        description: String(description).trim(),
        color: color || '#1a4d2e',
      };

      data.attractions.push(attraction);
      return { attractionId: attraction.id };
    });

    const data = await readData();
    const attraction = data.attractions.find((entry) => entry.id === result.attractionId);
    return res.status(201).json(presentAttraction(data, attraction));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
