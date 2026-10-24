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
  updateTripCapacity,
  updateTripStopStatus,
} from '../controllers/trips.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Collections
router.get('/trip-stops/all', getAllTripStops);
router.get('/:id/live', getLiveTripDetails);
router.get('/', getTrips);

// Create & Update
router.post('/', optionalAuth, createTrip);
router.put('/:id', optionalAuth, updateTrip);

// Lifecycle Operations
router.post('/:id/start', optionalAuth, startTrip);
router.post('/:id/end', optionalAuth, endTrip);
router.patch('/:id/cancel', optionalAuth, cancelTrip);
router.patch('/:id/capacity', optionalAuth, updateTripCapacity);
router.patch('/:tripId/stops/:stopId', optionalAuth, updateTripStopStatus);

export default router;
