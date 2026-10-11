import { Router } from 'express';
import { getAllTrips, createTrip, updateTrip, cancelTrip, updateTripCapacity, updateTripStopStatus } from '../controllers/trips.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Public
router.get('/', getAllTrips);

// Admin & Driver
router.patch('/:id/capacity', authenticateToken, requireRole(['admin', 'driver']), updateTripCapacity);
router.patch('/:id/stops/:stopId', authenticateToken, requireRole(['admin', 'driver']), updateTripStopStatus);

// Admin only
router.use(authenticateToken, requireRole(['admin']));
router.post('/', createTrip);
router.put('/:id', updateTrip);
router.patch('/:id/cancel', cancelTrip);

export default router;
