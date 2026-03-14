import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(express.json());
app.use(cors());

// ── ROUTES ────────────────────────────────────────────────
app.use('/api/auth',        require('/routes/auth.ts'));
app.use('/api/attractions', require('/routes/attraction.ts'));
app.use('/api/tours',       require('/routes/tour.ts'));
app.use('/api/bookings',    require('/routes/booking.ts'));
app.use('/api/reviews',     require('/routes/review.ts'));
app.use('/api/operators',   require('/routes/operator.ts'));
app.use('/api/analytics',   require('/routes/analytics.ts'));

// ── TEST ROUTE ────────────────────────────────────────────
app.get('/api/test', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Tourist Tome API is alive' });
});

// ── 404 HANDLER ───────────────────────────────────────────
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found.' });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong.' });
});

// ── START ─────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => console.log(`Tourist Tome API on port ${PORT}`));