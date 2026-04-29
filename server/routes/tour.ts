import { Router }       from 'express';
import TourController   from '../controllers/TourController';
import authenticate     from '../middleware/authenticate';
import authorize        from '../middleware/authorize';

const router = Router();

router.get('/',       TourController.getAll);
router.get('/:id',    TourController.getOne);

router.post('/',      authenticate, authorize('Operator', 'Admin'), TourController.create);
router.put('/:id',    authenticate, authorize('Operator', 'Admin'), TourController.update);
router.patch('/:id',  authenticate, authorize('Operator', 'Admin'), TourController.patch);
router.delete('/:id', authenticate, authorize('Operator', 'Admin'), TourController.remove);

export default router;