require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./bootstrap');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cors());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/attractions', require('./routes/attraction'));
app.use('/api/tours', require('./routes/tour'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/operators', require('./routes/operator'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users', require('./routes/users'));
app.use('/api/emergency', require('./routes/emergency'));

app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Tourist Tome API is alive' });
});

app.get('/', (req, res) => {
  res.redirect('/html/landing.html');
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Something went wrong.' });
});

async function start() {
  await initializeDatabase();
  const port = Number(process.env.PORT || 3000);

  app.listen(port, () => {
    console.log(`Tourist Tome API on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start Tourist Tome.');
  console.error(error);
  process.exit(1);
});
