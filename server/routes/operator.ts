import { Router }           from 'express';
import OperatorController   from '../controllers/OperatorController';
import authenticate         from '../middleware/authenticate';
import authorize            from '../middleware/authorize';

const router = Router();

router.get('/',          authenticate, authorize('Admin'),             OperatorController.getAll);
router.get('/:id/tours', authenticate, authorize('Admin', 'Operator'), OperatorController.getTours);
router.put('/:id',       authenticate, authorize('Admin'),             OperatorController.update);

export default router;