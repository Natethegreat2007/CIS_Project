require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const { initializeStore, readData } = require('./db');
const { optionalAuth } = require('./middleware/auth');
const {
  presentAttraction,
  presentTour,
  presentReview,
  presentUser,
} = require('./utils/domain');

async function startServer() {
  await initializeStore();

  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cors());

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/', (_req, res) => {
    res.redirect('/html/login.html');
  });

  app.get('/api/bootstrap', optionalAuth, async (req, res, next) => {
    try {
      const data = await readData();
      const payload = {
        attractions: data.attractions.map((entry) => presentAttraction(data, entry)),
        tours: data.tours.map((entry) => presentTour(data, entry)),
        reviews: data.reviews
          .map((entry) => presentReview(data, entry))
          .sort((left, right) => new Date(right.date) - new Date(left.date)),
        currentUser: req.user ? presentUser(data, req.user) : null,
      };

      res.json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/attractions', require('./routes/attraction'));
  app.use('/api/tours', require('./routes/tour'));
  app.use('/api/bookings', require('./routes/booking'));
  app.use('/api/reviews', require('./routes/review'));
  app.use('/api/operators', require('./routes/operator'));
  app.use('/api/analytics', require('./routes/analytics'));
  app.use('/api/users', require('./routes/users'));

  app.get('/api/test', (_req, res) => {
    res.status(200).json({ message: 'Tourist Tome API is alive' });
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Route not found.' });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Something went wrong.' });
  });

  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`Tourist Tome running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start Tourist Tome:', error);
  process.exit(1);
});
