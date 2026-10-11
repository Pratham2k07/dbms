import { Router } from 'express';
import { getAllShuttles, getShuttleById, createShuttle, updateShuttle, updateShuttleStatus, updateShuttleLocation } from '../controllers/shuttle.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Public
router.get('/', getAllShuttles);
router.get('/:id', getShuttleById);

// Driver & Admin
router.post('/:id/location', authenticateToken, requireRole(['driver', 'admin']), updateShuttleLocation);

// Admin only
router.post('/', authenticateToken, requireRole(['admin']), createShuttle);
router.put('/:id', authenticateToken, requireRole(['admin']), updateShuttle);
router.patch('/:id/status', authenticateToken, requireRole(['admin']), updateShuttleStatus);

export default router;
