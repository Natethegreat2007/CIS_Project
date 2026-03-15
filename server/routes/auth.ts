import { Router }       from 'express';
import AuthController   from '../controllers/AuthController';
import rateLimiter      from '../middleware/rateLimiter';
import authenticate     from '../middleware/authenticate';

const router = Router();

// ── PUBLIC ────────────────────────────────────────────────
router.post('/login', rateLimiter, AuthController.login);
router.post('/register', AuthController.register);

// ── PROTECTED ─────────────────────────────────────────────
router.post('/logout', authenticate, AuthController.logout);

export default router;