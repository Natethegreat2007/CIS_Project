import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
//import authRoutes        from './routes/auth';
import attractionRoutes  from './routes/attraction';
//import tourRoutes        from './routes/tour';
//import bookingRoutes     from './routes/booking';
//import reviewRoutes      from './routes/review';
//import operatorRoutes    from './routes/operator';
//import analyticsRoutes   from './routes/analytics';
import userRoutes from "./routes/users";
const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(express.json());
app.use(cors());

// ── ROUTES ────────────────────────────────────────────────
//app.use('/api/auth',        authRoutes);
app.use('/api/attractions', attractionRoutes);
app.use('/api/users', userRoutes)
//app.use('/api/tours',       tourRoutes);
//app.use('/api/bookings',    bookingRoutes);
//app.use('/api/reviews',     reviewRoutes);
//app.use('/api/operators',   operatorRoutes);
//app.use('/api/analytics',   analyticsRoutes);

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