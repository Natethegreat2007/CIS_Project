import { Router }         from 'express';
import BookingController  from '../controllers/BookingController';
import authenticate       from '../middleware/authenticate';
import authorize          from '../middleware/authorize';

const router = Router();

// specific routes before dynamic /:id
router.get('/mine',          authenticate, authorize('Tourist'),          BookingController.getMine);
router.get('/',              authenticate, authorize('Admin'),            BookingController.getAll);
router.post('/',             authenticate, authorize('Tourist'),          BookingController.create);
router.patch('/:id/cancel',  authenticate, authorize('Tourist', 'Admin'), BookingController.cancel);

export default router;