import { Router } from 'express';
import {
  getShuttles,
  createShuttle,
  updateShuttle,
  updateShuttleStatus,
  updateShuttleLocation,
} from '../controllers/shuttles.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getShuttles);
router.post('/', optionalAuth, createShuttle);
router.put('/:id', optionalAuth, updateShuttle);
router.patch('/:id/status', optionalAuth, updateShuttleStatus);
router.post('/:id/location', optionalAuth, updateShuttleLocation);

export default router;
