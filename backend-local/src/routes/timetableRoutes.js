import express from 'express';
import timetableController from '../controllers/timetableController.js';

const router = express.Router();

// Timetable Generation Routes
router.post('/generate', timetableController.generateTimetables);
router.post('/generate-single', timetableController.generateSingleTimetable);

// Utility Routes
router.get('/template', timetableController.getTimetableTemplate);
router.get('/health', timetableController.healthCheck);

export default router;