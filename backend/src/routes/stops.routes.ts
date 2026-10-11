import { Router } from 'express';
import { getRoutes, getStopsByRouteId, createRoute, updateRoute, deleteRoute, createStop, updateStop, deleteStop } from '../controllers/stops.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Publicly accessible
router.get('/', getRoutes);
router.get('/:routeId/stops', getStopsByRouteId);

// Admin only routes
router.use(authenticateToken, requireRole(['admin']));
router.post('/', createRoute);
router.put('/:id', updateRoute);
router.delete('/:id', deleteRoute);

// Stops specific routes
router.post('/stops', createStop);
router.put('/stops/:id', updateStop);
router.delete('/stops/:id', deleteStop);

export default router;
