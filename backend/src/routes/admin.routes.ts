import { Router } from 'express';
import { getDashboardStats } from '../controllers/admin.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Protect admin routes
router.use(authenticateToken, requireRole(['admin']));

router.get('/stats', getDashboardStats);

export default router;
