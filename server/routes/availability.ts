import { Router }                from 'express';
import AvailabilityController    from '../controllers/AvailabilityController';
import authenticate              from '../middleware/authenticate';
import authorize                 from '../middleware/authorize';

const router = Router();

router.get('/:tourID',  AvailabilityController.getForTour);
router.post('/',        authenticate, authorize('Operator', 'Admin'), AvailabilityController.create);
router.put('/:id',      authenticate, authorize('Operator', 'Admin'), AvailabilityController.update);

export default router;