// /backend/routes/authRoutes.js

import express from 'express';
const router = express.Router();
import {
  registerUser,
  authUser,
  logoutUser,
} from '../controllers/authController.js';

router.post('/signup', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);

export default router;