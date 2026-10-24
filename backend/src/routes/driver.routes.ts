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
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/assigned-trip', optionalAuth, getDriverAssignedTrip);
router.post('/start-shift', optionalAuth, startShift);
router.post('/end-shift', optionalAuth, endShift);
router.post('/location', optionalAuth, submitDriverLocation);

router.get('/', getDrivers);
router.post('/', optionalAuth, createDriver);
router.put('/:id', optionalAuth, updateDriver);
router.delete('/:id', optionalAuth, deleteDriver);

export default router;
