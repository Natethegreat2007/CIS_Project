import {Router} from 'express';
import UserController from '../controllers/UserController';
import authenticate from "../middleware/authenticate";
import authorize from "../middleware/authorize";

const router = Router();

//get all users
router.get('/', authenticate, authorize('Admin'), UserController.getAll);
//get a user by id
router.get('/:id', authenticate, authorize('Admin'), UserController.getOne);
//update by fields
router.patch('/:id', authenticate, authorize('Admin'), UserController.updatePartial);
//suspend state
router.patch('/:id/suspend', authenticate, authorize('Admin'), UserController.suspend);
//activate state
router.patch('/:id/activate', authenticate, authorize('Admin'), UserController.activate);
//deactivate state
router.patch('/:id/deactivate', authenticate, authorize('Admin'), UserController.deactivate);
//role change
router.patch("/:id/role", authenticate, authorize('Admin'), UserController.changeRole);
export default router;