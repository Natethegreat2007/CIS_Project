import { Router }             from 'express';
import AnalyticsController    from '../controllers/AnalyticsController';
import authenticate           from '../middleware/authenticate';
import authorize              from '../middleware/authorize';

const router = Router();

router.get('/summary',  authenticate, authorize('Admin'), AnalyticsController.getSummary);
router.get('/bookings', authenticate, authorize('Admin'), AnalyticsController.getBookings);

export default router;