import { Router } from 'express';
import { getAllDrivers, createDriver, updateDriver, deleteDriver, startShift, endShift } from '../controllers/driver.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken, requireRole(['admin', 'driver']));

// Admin routes
router.get('/', requireRole(['admin']), getAllDrivers);
router.post('/', requireRole(['admin']), createDriver);
router.put('/:id', requireRole(['admin']), updateDriver);
router.delete('/:id', requireRole(['admin']), deleteDriver);

// Driver routes
router.post('/start-shift', startShift);
router.post('/end-shift', endShift);

export default router;
