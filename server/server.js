require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

//middleware
app.use(express.json());
app.use(cors());

//routes
app.use('/api/auth',        require('/routes/auth.js'));
app.use('/api/attractions', require('/routes/attraction.js'));
app.use('/api/tours',       require('/routes/tour.js'));
app.use('/api/bookings',    require('/routes/booking.js'));
app.use('/api/reviews',     require('/routes/review.js'));
app.use('/api/operators',   require('/routes/operator.js'));
app.use('/api/analytics',   require('/routes/analytics.js'));


app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'Tourist Tome API is alive' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Tourist Tome API on port ${PORT}`));