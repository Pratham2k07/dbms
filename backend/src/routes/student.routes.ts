import { Router } from 'express';
import {
  recordStudentLocation,
  getStudentNearbyStops,
  getLatestStudentLocation,
  getActiveStudentTrips,
} from '../controllers/student.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/location', optionalAuth, recordStudentLocation);
router.get('/nearby-stops', getStudentNearbyStops);
router.get('/location/latest', optionalAuth, getLatestStudentLocation);
router.get('/active-trips', getActiveStudentTrips);

export default router;
