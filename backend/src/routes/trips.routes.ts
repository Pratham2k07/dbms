import { Router } from 'express';
import {
  getAllTrips,
  getTripById,
  getLiveTrip,
  createTrip,
  updateTrip,
  startTrip,
  endTrip,
  cancelTrip,
  updateTripCapacity,
  updateTripStopStatus
} from '../controllers/trips.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Public routes for student and passenger tracking
router.get('/', getAllTrips);
router.get('/:id/live', getLiveTrip);
router.get('/:id', getTripById);

// Driver & Admin operational controls
router.post('/:id/start', authenticateToken, requireRole(['admin', 'driver']), startTrip);
router.patch('/:id/start', authenticateToken, requireRole(['admin', 'driver']), startTrip);
router.post('/:id/end', authenticateToken, requireRole(['admin', 'driver']), endTrip);
router.patch('/:id/end', authenticateToken, requireRole(['admin', 'driver']), endTrip);
router.patch('/:id/capacity', authenticateToken, requireRole(['admin', 'driver']), updateTripCapacity);
router.patch('/:id/stops/:stopId', authenticateToken, requireRole(['admin', 'driver']), updateTripStopStatus);

// Admin-only management
router.post('/', authenticateToken, requireRole(['admin']), createTrip);
router.put('/:id', authenticateToken, requireRole(['admin']), updateTrip);
router.patch('/:id/cancel', authenticateToken, requireRole(['admin']), cancelTrip);

export default router;
