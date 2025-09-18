import express from 'express';
import aiRoutes from './aiRoutes.js';
import timetableRoutes from './timetableRoutes.js';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/ai', aiRoutes);
router.use('/timetable', timetableRoutes);

export default router;