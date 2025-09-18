import express from 'express';
import aiController from '../controllers/aiController.js';

const router = express.Router();

// AI Routes
router.post('/generate', aiController.generateText);
router.post('/chat', aiController.chat);
router.post('/analyze-timetable', aiController.analyzeTimetable);
router.get('/health', aiController.healthCheck);

export default router;