import { Router } from 'express';
import {
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  startShift,
  endShift,
  getAssignedTrip,
  startTrip,
  endTrip,
  submitDriverLocation
} from '../controllers/driver.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Driver operational routes (driver and admin)
router.get('/assigned-trip', requireRole(['admin', 'driver']), getAssignedTrip);
router.post('/start-trip', requireRole(['admin', 'driver']), startTrip);
router.post('/trips/:tripId/start', requireRole(['admin', 'driver']), startTrip);
router.post('/end-trip', requireRole(['admin', 'driver']), endTrip);
router.post('/trips/:tripId/end', requireRole(['admin', 'driver']), endTrip);
router.post('/location', requireRole(['admin', 'driver']), submitDriverLocation);
router.post('/start-shift', requireRole(['admin', 'driver']), startShift);
router.post('/end-shift', requireRole(['admin', 'driver']), endShift);

// Admin-only CRUD routes
router.get('/', requireRole(['admin']), getAllDrivers);
router.post('/', requireRole(['admin']), createDriver);
router.put('/:id', requireRole(['admin']), updateDriver);
router.delete('/:id', requireRole(['admin']), deleteDriver);

export default router;
