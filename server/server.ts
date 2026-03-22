import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pool from './db';

import authRoutes         from './routes/auth';
import attractionRoutes   from './routes/attraction';
import tourRoutes         from './routes/tour';
import bookingRoutes      from './routes/booking';
import reviewRoutes       from './routes/review';
import operatorRoutes     from './routes/operator';
import analyticsRoutes    from './routes/analytics';
import userRoutes         from './routes/users';
import availabilityRoutes from './routes/availability';

const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(express.json());
app.use(cors());

// ── ROUTES ────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/attractions',  attractionRoutes);
app.use('/api/tours',        tourRoutes);
app.use('/api/bookings',     bookingRoutes);
app.use('/api/reviews',      reviewRoutes);
app.use('/api/operators',    operatorRoutes);
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/availability', availabilityRoutes);

// Route test
app.get('/api/test', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Tourist Tome API is alive' });
});

app.get('/api/dbtest', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        res.status(200).json(rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// 404 Status
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found.' });
});

//Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong.' });
});

// Start, start, start the party! Come on come on start the party!
const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => console.log(`Tourist Tome API on port ${PORT}`));