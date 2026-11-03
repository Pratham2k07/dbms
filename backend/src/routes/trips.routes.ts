import { Router } from 'express';
import {
  getTrips,
  getAllTripStops,
  getLiveTripDetails,
  createTrip,
  updateTrip,
  startTrip,
  endTrip,
  cancelTrip,
  deleteTrip,
  updateTripCapacity,
  updateTripStopStatus,
} from '../controllers/trips.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Collections (Public read for student portal, map view, etc.)
router.get('/trip-stops/all', getAllTripStops);
router.get('/:id/live', getLiveTripDetails);
router.get('/', getTrips);

// Create & Update (Authenticated)
router.post('/', authenticateJWT, createTrip);
router.put('/:id', authenticateJWT, updateTrip);

// Lifecycle Operations (Authenticated)
router.post('/:id/start', authenticateJWT, startTrip);
router.post('/:id/end', authenticateJWT, endTrip);
router.patch('/:id/cancel', authenticateJWT, cancelTrip);
router.delete('/:id', authenticateJWT, deleteTrip);
router.patch('/:id/capacity', authenticateJWT, updateTripCapacity);
router.patch('/:tripId/stops/:stopId', authenticateJWT, updateTripStopStatus);

export default router;
