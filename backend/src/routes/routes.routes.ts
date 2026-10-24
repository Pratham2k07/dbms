import { Router } from 'express';
import {
  getRoutes,
  getAllRouteStops,
  getStopsByRoute,
  createRoute,
  updateRoute,
  deleteRoute,
} from '../controllers/routes.controller.js';
import {
  getAllStops,
  createStop,
  updateStop,
  deleteStop,
} from '../controllers/stops.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Route-stops associative collection
router.get('/route-stops/all', getAllRouteStops);

// Stops endpoints nested under routes (matches apiService: /routes/stops/...)
router.get('/stops/all', getAllStops);
router.post('/stops', optionalAuth, createStop);
router.put('/stops/:id', optionalAuth, updateStop);
router.delete('/stops/:id', optionalAuth, deleteStop);

// Route-specific stop sequence
router.get('/:id/stops', getStopsByRoute);

// Route CRUD
router.get('/', getRoutes);
router.post('/', optionalAuth, createRoute);
router.put('/:id', optionalAuth, updateRoute);
router.delete('/:id', optionalAuth, deleteRoute);

export default router;
