import { Router } from 'express';
import { recordLocation, getNearbyStops, getLatestLocation, getActiveStudentTrips } from '../controllers/student.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Student authenticated endpoints
router.post('/location', authenticateToken, recordLocation);
router.get('/location/latest', authenticateToken, getLatestLocation);
router.get('/nearby-stops', authenticateToken, getNearbyStops);
router.get('/active-trips', authenticateToken, getActiveStudentTrips);

export default router;
