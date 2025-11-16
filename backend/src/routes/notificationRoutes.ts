import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

// Get all notifications for authenticated user
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread/count', getUnreadCount);

// Mark all notifications as read
router.put('/read-all', markAllNotificationsAsRead);

// Mark specific notification as read
router.put('/:id/read', markNotificationAsRead);

// Delete specific notification
router.delete('/:id', deleteNotification);

export default router;
