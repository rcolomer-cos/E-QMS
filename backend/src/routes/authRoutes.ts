import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { validateUser, validateLogin } from '../utils/validators';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', validateUser, register);
router.post('/login', validateLogin, login);
router.get('/profile', authenticateToken, getProfile);

export default router;
