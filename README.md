# TT-Automation

A comprehensive web-based timetable automation system that leverages OpenAI's GPT models to generate intelligent, conflict-free academic schedules. The system provides real-time conflict detection, workload analysis, and resource optimization for educational institutions.

## Overview

TT-Automation is a full-stack application designed to streamline the complex process of academic timetable generation. By integrating AI-powered scheduling algorithms with an intuitive user interface, the system automatically manages teacher assignments, room allocations, and course distributions while ensuring zero scheduling conflicts.

**Key Features:**
- AI-driven conflict-free timetable generation
- Real-time teacher, room, and course workload analysis
- Multi-class scheduling with cross-validation
- Firebase authentication and data persistence
- PDF export functionality for generated schedules
- Responsive web interface built with React and Tailwind CSS

---

## Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Documentation](#api-documentation)
- [Core Features](#core-features)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture

The application follows a client-server architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (React + Vite + TailwindCSS + Firebase Auth)               │
│  - User Interface                                            │
│  - State Management                                          │
│  - PDF Generation                                            │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST API
┌────────────────────────┴────────────────────────────────────┐
│                     Backend Layer                            │
│  (Node.js + Express + OpenAI SDK)                           │
│  - RESTful API Endpoints                                     │
│  - AI Service Integration                                    │
│  - Business Logic                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                  │
┌───────┴────────┐              ┌─────────┴─────────┐
│  OpenAI API    │              │   Firebase        │
│  (GPT-4o-mini) │              │   (Auth + DB)     │
└────────────────┘              └───────────────────┘
```

---

## Technology Stack

### Backend ([`backend-local/`](#backend-local))
- **Runtime:** Node.js v16+
- **Framework:** Express.js v5.1.0
- **AI Integration:** OpenAI SDK v4.104.0
- **Security:** Helmet.js, CORS
- **Environment:** dotenv

### Frontend ([`client/`](#client))
- **Framework:** React v19.1.1
- **Build Tool:** Vite v7.1.2
- **Styling:** Tailwind CSS v4.1.13
- **Routing:** React Router DOM v7.8.2
- **Authentication:** Firebase v12.2.1
- **PDF Generation:** jsPDF v3.0.4 with jsPDF-AutoTable v5.0.2
- **Icons:** React Icons v5.5.0

---

## Project Structure

```
openAI-NxtWave-tt/
│
├── backend-local/              # Backend API Server
│   ├── src/
│   │   ├── config/            # Configuration management
│   │   │   └── index.js       # Environment variables and app config
│   │   │
│   │   ├── controllers/       # Request handlers
│   │   │   ├── aiController.js         # AI service endpoints
│   │   │   └── timetableController.js  # Timetable generation logic
│   │   │
│   │   ├── services/          # Business logic layer
│   │   │   ├── openaiService.js       # OpenAI API integration
│   │   │   ├── timetableService.js    # Timetable generation service
│   │   │   └── timetableUtils.js      # Utility functions
│   │   │
│   │   ├── routes/            # API route definitions
│   │   │   ├── index.js              # Main router
│   │   │   ├── aiRoutes.js           # AI-specific routes
│   │   │   └── timetableRoutes.js    # Timetable routes
│   │   │
│   │   └── middleware/        # Express middleware
│   │       ├── errorHandler.js      # Error handling
│   │       └── requestLogger.js     # Request logging
│   │
│   ├── server.js              # Application entry point
│   ├── package.json           # Dependencies and scripts
│   ├── README.md              # Backend documentation
│   └── TIMETABLE_TESTING.md   # API testing guide
│
└── client/                    # Frontend Application
    ├── src/
    │   ├── Components/        # Reusable components
    │   │   ├── Menu.jsx              # Navigation menu
    │   │   └── ExportDataComponent.jsx
    │   │
    │   ├── pages/             # Page components
    │   │   ├── TimeTable.jsx         # Main timetable interface
    │   │   ├── CourseLoad.jsx        # Course workload analysis
    │   │   ├── TeacherLoad.jsx       # Teacher workload analysis
    │   │   ├── RoomLoad.jsx          # Room utilization
    │   │   ├── RoomAvailability.jsx  # Room availability view
    │   │   ├── ClassCurriculum.jsx   # Curriculum management
    │   │   ├── ExportData.jsx        # Data export interface
    │   │   ├── Login.jsx             # Authentication
    │   │   └── Signup.jsx            # User registration
    │   │
    │   ├── services/          # API service layer
    │   │   ├── TimeTable.js          # Timetable CRUD operations
    │   │   ├── AIService.js          # AI service communication
    │   │   ├── Conflicts.js          # Conflict detection
    │   │   ├── CourseLoad.js         # Course analytics
    │   │   ├── TeacherLoad.js        # Teacher analytics
    │   │   ├── RoomLoad.js           # Room analytics
    │   │   └── ExportData.js         # Export functionality
    │   │
    │   ├── utils/             # Utility functions
    │   │   └── pdfExport.js          # PDF generation utilities
    │   │
    │   ├── firebase/          # Firebase configuration
    │   │   └── firebaseConfig.js
    │   │
    │   ├── App.jsx            # Main application component
    │   ├── main.jsx           # Application entry point
    │   ├── App.css            # Global styles
    │   └── index.css          # Base styles
    │
    ├── public/                # Static assets
    ├── index.html             # HTML template
    ├── package.json           # Dependencies and scripts
    ├── vite.config.js         # Vite configuration
    ├── tailwind.config.js     # Tailwind CSS configuration
    ├── eslint.config.js       # ESLint configuration
    ├── vercel.json            # Vercel deployment config
    └── README.md              # Frontend documentation
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** v16.0.0 or higher
- **npm** v8.0.0 or higher
- **Git** for version control
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **Firebase Project** ([Create project](https://console.firebase.google.com/))

### Backend Setup

Navigate to the backend directory:

```bash
cd backend-local
```

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Environment Configuration

Create a `.env` file in the `backend-local` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**Important:** Replace `your_openai_api_key_here` with your actual OpenAI API key.

#### 3. Start the Backend Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will be available at `http://localhost:3000`

**Verify Installation:**
```bash
curl http://localhost:3000/api/health
```

### Frontend Setup

Navigate to the client directory:

```bash
cd client
```

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Firebase Configuration

Create or update `src/firebase/firebaseConfig.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your_firebase_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

#### 3. API Endpoint Configuration

Update the API endpoint in service files to point to your backend:

```javascript
// In client/src/services/AIService.js and other service files
const API_BASE_URL = 'http://localhost:3000/api';
```

#### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

#### 5. Build for Production

```bash
npm run build
```

Production files will be generated in the `dist/` directory.

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Health Check Endpoints

#### Server Health
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### AI Service Health
```http
GET /ai/health
```

---

### AI Service Endpoints

#### Generate Text
```http
POST /ai/generate
Content-Type: application/json

{
  "prompt": "Your prompt here",
  "options": {
    "model": "gpt-4o-mini",
    "maxTokens": 1000,
    "temperature": 0.7
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Generated text response",
    "prompt": "Your prompt here"
  }
}
```

#### Chat with Context
```http
POST /ai/chat
Content-Type: application/json

{
  "message": "Your message",
  "history": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ]
}
```

#### Analyze Timetable
```http
POST /ai/analyze-timetable
Content-Type: application/json

{
  "timetableData": {
    "class": "CSE-A",
    "schedule": {...}
  },
  "analysisType": "conflicts"
}
```

**Analysis Types:** `conflicts`, `optimization`, `load`, `general`

---

### Timetable Generation Endpoints

#### Generate Multiple Timetables
```http
POST /timetable/generate
Content-Type: application/json

{
  "classes": [...],
  "courses": [...],
  "teachers": [...],
  "rooms": [...]
}
```

See [`backend-local/TIMETABLE_TESTING.md`](#timetable-testing) for detailed request/response examples.

#### Generate Single Timetable
```http
POST /timetable/generate-single
Content-Type: application/json

{
  "classData": {...},
  "courses": [...],
  "teachers": [...],
  "rooms": [...]
}
```

#### Get Timetable Template
```http
GET /timetable/template
```

Returns the expected timetable structure format.

---

## Core Features

### 1. AI-Powered Timetable Generation

The system uses OpenAI's GPT-4o-mini model to generate intelligent schedules that:
- Automatically detect and prevent teacher conflicts
- Optimize room allocation based on capacity
- Balance workload distribution across the week
- Respect credit limits and course constraints
- Generate multiple class schedules simultaneously

### 2. Conflict Detection and Resolution

Multi-layered conflict detection system:
- **Teacher Conflicts:** Prevents double-booking of instructors
- **Room Conflicts:** Ensures single occupancy per time slot
- **Credit Violations:** Validates against maximum credit limits
- **Cross-Class Validation:** Checks conflicts across all generated schedules

### 3. Workload Analytics

Comprehensive analytics dashboards for:
- **Course Load:** Track course distribution and scheduling patterns
- **Teacher Load:** Monitor teaching hours and workload balance
- **Room Load:** Analyze room utilization and availability

### 4. Data Management

- **Firebase Integration:** Real-time data synchronization
- **CRUD Operations:** Full create, read, update, delete functionality
- **Export Capabilities:** Generate PDF reports of schedules
- **Curriculum Management:** Define and manage class curriculums

### 5. User Interface

- Responsive design for desktop and mobile devices
- Intuitive drag-and-drop scheduling interface
- Visual conflict indicators and warnings
- Real-time updates and validation

---

## Deployment

### Backend Deployment

The backend can be deployed to any Node.js hosting platform:

**Environment Variables Required:**
```env
OPENAI_API_KEY=<your_key>
NODE_ENV=production
CORS_ORIGIN=<your_frontend_url>
```

**Recommended Platforms:**
- Railway
- Render
- Heroku
- AWS Elastic Beanstalk
- Google Cloud Run

### Frontend Deployment

The application is configured for Vercel deployment with [`vercel.json`](#vercel-config):

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd client
vercel
```

**Alternative Platforms:**
- Netlify
- Vercel
- AWS Amplify
- GitHub Pages (static build)

**Build Command:**
```bash
npm run build
```

**Output Directory:** `dist`

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes:**
   ```bash
   git commit -m "Add your feature description"
   ```
4. **Push to the branch:**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**

### Code Standards

- Follow existing code structure and naming conventions
- Write meaningful commit messages
- Test your changes thoroughly before submitting
- Update documentation for new features
- Ensure ESLint passes without errors

---

## License

This project is licensed under the ISC License.

---

## Support

For issues, questions, or contributions:
- **Repository:** [AlakhBabbar/tt-automation](https://github.com/AlakhBabbar/tt-automation)
- **Issues:** [GitHub Issues](https://github.com/AlakhBabbar/tt-automation/issues)

---

**Built with:** Node.js, React, OpenAI API, and Firebase

**Author:** Alakh Babbar, Vaibhav Kaushal
