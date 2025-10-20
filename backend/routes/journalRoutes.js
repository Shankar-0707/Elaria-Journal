// /backend/routes/journalRoutes.js

import express from 'express';
const router = express.Router();
import { protect } from '../middlewares/authMiddleware.js';
import { 
    startSession, 
    continueSession, 
    completeSession ,
    getUserJournals
} from '../controllers/journalController.js';
// Note: Multer will be needed for handling file uploads (audio/image) in the controller

// All these routes require a logged-in user (protected)
router.post('/start', protect, startSession);
router.post('/continue/:id', protect, continueSession); // :id is the Journal ID
router.post('/complete/:id', protect, completeSession); // :id is the Journal ID
router.get('/', protect, getUserJournals);

export default router;