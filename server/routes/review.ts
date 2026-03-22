import { Router }         from 'express';
import ReviewController   from '../controllers/ReviewController';
import authenticate       from '../middleware/authenticate';
import authorize          from '../middleware/authorize';

const router = Router();

router.get('/tour/:tourID',  ReviewController.getForTour);
router.post('/',  authenticate, authorize('Tourist'), ReviewController.submit);

export default router;