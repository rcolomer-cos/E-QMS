import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { validateUser, validateLogin } from '../utils/validators';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validateUser, register);
router.post('/login', authLimiter, validateLogin, login);
router.get('/profile', authenticateToken, getProfile);

export default router;
