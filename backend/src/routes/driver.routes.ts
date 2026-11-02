import { Router } from 'express';
import {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverAssignedTrip,
  startShift,
  endShift,
  submitDriverLocation,
} from '../controllers/driver.controller.js';
import { authenticateJWT, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/assigned-trip', optionalAuth, getDriverAssignedTrip);
router.post('/start-shift', authenticateJWT, startShift);
router.post('/end-shift', authenticateJWT, endShift);
router.post('/location', authenticateJWT, submitDriverLocation);

router.get('/', getDrivers);
router.post('/', authenticateJWT, createDriver);
router.put('/:id', authenticateJWT, updateDriver);
router.delete('/:id', authenticateJWT, deleteDriver);

export default router;
