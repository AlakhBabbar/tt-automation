import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import TimeTable from './pages/TimeTable'
import CourseLoad from './pages/CourseLoad'
import RoomLoad from './pages/RoomLoad'
import TeacherLoad from './pages/TeacherLoad'

function App() {
  return (
    <Router>
          <Routes>
            <Route path="/" element={<TimeTable />} />
            <Route path="/courses" element={<CourseLoad />} />
            <Route path="/teachers" element={<TeacherLoad />} />
            <Route path="/rooms" element={<RoomLoad />} />
          </Routes>
    </Router>
  )
}

// Navigation link styles
const navLinkStyle = {
  color: '#64748b',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  padding: '8px 16px',
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  ':hover': {
    backgroundColor: '#f1f5f9',
    color: '#667eea'
  }
}

export default App
