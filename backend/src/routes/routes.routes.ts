import { Router } from 'express';
import {
  getRoutes,
  getAllRouteStops,
  getStopsByRoute,
  createRoute,
  updateRoute,
  cancelRoute,
  deleteRoute,
} from '../controllers/routes.controller.js';
import {
  getAllStops,
  createStop,
  updateStop,
  deleteStop,
} from '../controllers/stops.controller.js';
import { authenticateJWT, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Route-stops associative collection
router.get('/route-stops/all', getAllRouteStops);

// Stops endpoints nested under routes (matches apiService: /routes/stops/...)
router.get('/stops/all', getAllStops);
router.post('/stops', authenticateJWT, createStop);
router.put('/stops/:id', authenticateJWT, updateStop);
router.delete('/stops/:id', authenticateJWT, deleteStop);

// Route-specific stop sequence
router.get('/:id/stops', getStopsByRoute);

// Route CRUD
router.get('/', getRoutes);
router.post('/', authenticateJWT, createRoute);
router.put('/:id', authenticateJWT, updateRoute);
router.patch('/:id/cancel', authenticateJWT, cancelRoute);
router.delete('/:id', authenticateJWT, deleteRoute);

export default router;
