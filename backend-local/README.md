# TT-Automation Backend Local

A clean, organized Node.js Express server for integrating with Google's Gemini AI API for timetable automation.

## 🏗️ Project Structure

```
backend-local/
├── src/
│   ├── config/           # Configuration files
│   │   └── index.js      # Environment and app configuration
│   ├── controllers/      # Request handlers
│   │   └── aiController.js
│   ├── services/         # Business logic
│   │   └── geminiService.js
│   ├── routes/           # API routes
│   │   ├── index.js      # Main router
│   │   └── aiRoutes.js   # AI-specific routes
│   └── middleware/       # Custom middleware
│       ├── errorHandler.js
│       └── requestLogger.js
├── server.js             # Main server file
├── package.json          # Dependencies and scripts
├── .env.example          # Environment variables template
└── .gitignore           # Git ignore rules
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Start the server:**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## 📡 API Endpoints

### Health Check
- **GET** `/api/health` - Server health status
- **GET** `/api/ai/health` - AI service health status

### AI Services
- **POST** `/api/ai/generate` - Generate text using Gemini AI
  ```json
  {
    "prompt": "Your prompt here",
    "options": {} // Optional generation options
  }
  ```

- **POST** `/api/ai/chat` - Chat conversation with context
  ```json
  {
    "message": "Your message",
    "history": [] // Optional chat history
  }
  ```

- **POST** `/api/ai/analyze-timetable` - Analyze timetable data
  ```json
  {
    "timetableData": {}, // Your timetable data
    "analysisType": "conflicts" // "conflicts", "optimization", "load", or "general"
  }
  ```

## 🔧 Configuration

The application uses environment variables for configuration:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `GEMINI_API_KEY` - Google Gemini API key (required)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:5173)

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Request validation** - Input validation and sanitization
- **Error handling** - Comprehensive error handling middleware

## 📝 Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon
- `npm test` - Run tests (to be implemented)

## 🤝 Contributing

1. Follow the established folder structure
2. Use meaningful commit messages
3. Test your changes before submitting
4. Update documentation as needed

## 📄 License

ISC