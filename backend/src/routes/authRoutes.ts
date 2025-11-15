import { Router } from 'express';
import { 
  register, 
  login, 
  getProfile, 
  checkSuperusers, 
  createInitialSuperuser 
} from '../controllers/authController';
import { validateUser, validateLogin } from '../utils/validators';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.get('/check-superusers', checkSuperusers); // Check if system has superusers (for bootstrap)
router.post('/initial-superuser', authLimiter, validateUser, createInitialSuperuser); // Create first superuser

// Authentication routes
router.post('/register', authLimiter, validateUser, register); // Protected in controller
router.post('/login', authLimiter, validateLogin, login);
router.post('/logout', authenticateToken, logout);
router.post('/refresh', authenticateToken, refresh);
router.get('/profile', authenticateToken, getProfile);

export default router;
