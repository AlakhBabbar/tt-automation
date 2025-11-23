import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './src/config/index.js';
import routes from './src/routes/index.js';
import requestLogger from './src/middleware/requestLogger.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';

// Validate configuration on startup
try {
  validateConfig();
  console.log('✅ Configuration validated successfully');
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: 'https://tt-automation.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(requestLogger);

// Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TT-Automation Backend Local Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      // AI Endpoints
      aiGenerate: '/api/ai/generate',
      aiChat: '/api/ai/chat',
      aiAnalyzeTimetable: '/api/ai/analyze-timetable',
      aiHealth: '/api/ai/health',
      // Timetable Generation Endpoints
      timetableGenerate: '/api/timetable/generate',
      timetableGenerateSingle: '/api/timetable/generate-single',
      timetableTemplate: '/api/timetable/template',
      timetableHealth: '/api/timetable/health'
    }
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// // Start server
// const server = app.listen(config.port, () => {
//   console.log(`🚀 Server running on port ${config.port}`);
//   console.log(`📍 Environment: ${config.nodeEnv}`);
//   console.log(`🌐 Access server at: http://localhost:${config.port}`);
//   console.log(`🔗 API endpoints available at: http://localhost:${config.port}/api`);
// });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;