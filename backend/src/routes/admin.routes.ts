import { Router } from 'express';
import { getAdminStats, getUsers, createUser, deleteUser } from '../controllers/admin.controller.js';

const router = Router();

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);

export default router;
