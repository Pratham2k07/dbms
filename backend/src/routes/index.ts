import { Router } from 'express';
import authRoutes from './auth.routes.js';
import routesRoutes from './routes.routes.js';
import shuttlesRoutes from './shuttles.routes.js';
import tripsRoutes from './trips.routes.js';
import driverRoutes from './driver.routes.js';
import studentRoutes from './student.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/routes', routesRoutes);
router.use('/shuttles', shuttlesRoutes);
router.use('/trips', tripsRoutes);
router.use('/driver', driverRoutes);
router.use('/student', studentRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'JKLU Shuttle Transit Backend API',
  });
});

export default router;
