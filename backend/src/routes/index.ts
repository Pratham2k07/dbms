import { Router, Request, Response } from 'express';

const router = Router();

// Health check route
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

import authRoutes from './auth.routes';
import shuttleRoutes from './shuttle.routes';
import stopsRoutes from './stops.routes';
import driverRoutes from './driver.routes';
import adminRoutes from './admin.routes';
import tripsRoutes from './trips.routes';

router.use('/auth', authRoutes);
router.use('/shuttles', shuttleRoutes);
router.use('/routes', stopsRoutes);
router.use('/driver', driverRoutes);
router.use('/admin', adminRoutes);
router.use('/trips', tripsRoutes);

export default router;
