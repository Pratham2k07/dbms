import { Router } from 'express';
import {
  getShuttles,
  getLatestShuttleLocations,
  createShuttle,
  updateShuttle,
  updateShuttleStatus,
  updateShuttleLocation,
} from '../controllers/shuttles.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/locations/latest', getLatestShuttleLocations);
router.get('/', getShuttles);
router.post('/', authenticateJWT, createShuttle);
router.put('/:id', authenticateJWT, updateShuttle);
router.patch('/:id/status', authenticateJWT, updateShuttleStatus);
router.post('/:id/location', authenticateJWT, updateShuttleLocation);

export default router;
