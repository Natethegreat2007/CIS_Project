import { Router }      from 'express';
import AuthController  from '../controllers/AuthController';
import authenticate    from '../middleware/authenticate';
import rateLimiter     from '../middleware/rateLimiter';

const router = Router();

router.post('/login', rateLimiter, AuthController.login);
router.post('/register', AuthController.register);
router.post('/logout', authenticate, AuthController.logout);

export default router;