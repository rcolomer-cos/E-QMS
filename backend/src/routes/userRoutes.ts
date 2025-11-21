import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  deleteUser,
  assignRole,
  revokeRole,
  generatePassword,
  generateSinglePassword,
  getAllRoles,
  uploadAvatar,
  deleteAvatar,
} from '../controllers/userController';
import { validateUser, validateId } from '../utils/validators';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// Configure multer for avatar uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');

// Ensure upload directory exists
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

// Password generation (admin/superuser only)
router.get('/generate-password', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), generatePassword);
router.get('/generate-password-single', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), generateSinglePassword);

// Role management
router.get('/roles', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), getAllRoles);

// Current user profile (any authenticated user)
router.get('/me', getCurrentUser);

// User CRUD operations (admin/superuser only)
router.get('/', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), getAllUsers);
router.get('/:id', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, getUserById);
router.post('/', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateUser, createUser);
router.put('/:id', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, updateUser);
router.delete('/:id', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, deleteUser);

// Avatar management (authenticated users can manage their own, admins can manage all)
router.post('/:id/avatar', validateId, avatarUpload.single('avatar'), uploadAvatar);
router.delete('/:id/avatar', validateId, deleteAvatar);

// Role assignment (admin/superuser only, but superuser restrictions apply in controller)
router.post('/:id/roles', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, assignRole);
router.delete('/:id/roles', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, revokeRole);

export default router;
