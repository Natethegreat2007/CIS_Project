const router = require('express').Router();
const { pool } = require('../db');
const { getAttractionById, listAttractions } = require('../lib/catalog');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/meta/categories', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT catID AS id, catName AS name FROM AttrCategory ORDER BY catName ASC'
  );
  res.json({ categories: rows });
});

router.get('/', async (req, res) => {
  const attractions = await listAttractions(pool, {
    search: req.query.search || '',
    category: req.query.category || '',
  });

  res.json({ attractions });
});

router.get('/:id', async (req, res) => {
  const attraction = await getAttractionById(pool, Number(req.params.id));

  if (!attraction) {
    return res.status(404).json({ error: 'Attraction not found.' });
  }

  res.json({ attraction });
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const {
    name,
    category,
    location,
    price,
    description,
    imagePath = '/images/jungle-bg3.jpg',
  } = req.body;

  if (!name || !category || !location || price === undefined || !description) {
    return res.status(400).json({ error: 'Name, category, location, price, and description are required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [categoryRows] = await connection.query(
      'SELECT catID FROM AttrCategory WHERE catName = ? LIMIT 1',
      [category]
    );

    if (!categoryRows[0]) {
      await connection.rollback();
      return res.status(400).json({ error: 'Selected attraction category does not exist.' });
    }

    const [result] = await connection.query(
      `
        INSERT INTO Attraction (title, descr, catID, location, basePrice)
        VALUES (?, ?, ?, ?, ?)
      `,
      [name.trim(), description.trim(), categoryRows[0].catID, location.trim(), Number(price)]
    );

    await connection.query(
      `
        INSERT INTO AttrMedia (attrID, mediaPath, mediaType, displayOrder, alt)
        VALUES (?, ?, 'image', 0, ?)
      `,
      [result.insertId, imagePath, name.trim()]
    );

    await connection.commit();

    const attraction = await getAttractionById(pool, result.insertId);
    return res.status(201).json({ attraction });
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An attraction with that name already exists.' });
    }

    throw error;
  } finally {
    connection.release();
  }
});

module.exports = router;
