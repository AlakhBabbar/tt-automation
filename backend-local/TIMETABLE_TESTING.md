# 🎯 Timetable Generation API Testing Guide

## 📡 **New Timetable Endpoints**

### **Base URL:** `http://localhost:3000/api/timetable`

---

## 🧪 **Test Endpoints & Sample Data**

### **1. Get Timetable Template**
**Method:** `GET`  
**URL:** `http://localhost:3000/api/timetable/template`  
**Purpose:** Get the exact structure that AI should return

---

### **2. Health Check**
**Method:** `GET`  
**URL:** `http://localhost:3000/api/timetable/health`  
**Purpose:** Verify timetable service is working

---

### **3. Generate Single Timetable (Simple Test)**
**Method:** `POST`  
**URL:** `http://localhost:3000/api/timetable/generate-single`  
**Headers:**
```
Content-Type: application/json
```
**Body (Minimal Test Data):**
```json
{
  "classData": {
    "id": "btech_cse_1",
    "batch": "2024-25",
    "branch": "Computer Science",
    "semester": "1",
    "program": "BTech",
    "type": "full-time",
    "overallCredits": "12"
  },
  "courses": [
    {
      "code": "CS101",
      "name": "Programming Fundamentals",
      "credits": 4,
      "hoursPerWeek": 4
    },
    {
      "code": "MATH101",
      "name": "Engineering Mathematics", 
      "credits": 4,
      "hoursPerWeek": 4
    },
    {
      "code": "ENG101",
      "name": "Technical English",
      "credits": 3,
      "hoursPerWeek": 3
    }
  ],
  "teachers": [
    {
      "id": "T001",
      "name": "Dr. Alakh Babbar",
      "maxHoursPerWeek": 20
    },
    {
      "id": "T002", 
      "name": "Prof. Smith",
      "maxHoursPerWeek": 18
    },
    {
      "id": "T003",
      "name": "Dr. Sarah",
      "maxHoursPerWeek": 16
    }
  ],
  "rooms": [
    {
      "id": "R001",
      "name": "Lecture Theatre 1",
      "capacity": 100
    },
    {
      "id": "R002",
      "name": "Classroom A101", 
      "capacity": 60
    }
  ]
}
```

---

### **4. Generate Multiple Timetables (Full Test)**
**Method:** `POST`  
**URL:** `http://localhost:3000/api/timetable/generate`  
**Headers:**
```
Content-Type: application/json
```
**Body (Complete Test Data):**
```json
{
  "classes": [
    {
      "id": "btech_cse_1",
      "batch": "2024-25",
      "branch": "Computer Science",
      "semester": "1",
      "program": "BTech",
      "type": "full-time",
      "overallCredits": "24",
      "students": 60
    },
    {
      "id": "btech_ece_1",
      "batch": "2024-25", 
      "branch": "Electronics",
      "semester": "1",
      "program": "BTech",
      "type": "full-time",
      "overallCredits": "24",
      "students": 55
    }
  ],
  "courses": [
    {
      "code": "CS101",
      "name": "Programming Fundamentals",
      "credits": 4,
      "type": "theory",
      "hoursPerWeek": 4,
      "prerequisites": []
    },
    {
      "code": "CS102",
      "name": "Programming Lab",
      "credits": 2,
      "type": "lab", 
      "hoursPerWeek": 3,
      "prerequisites": []
    },
    {
      "code": "MATH101",
      "name": "Engineering Mathematics",
      "credits": 4,
      "type": "theory",
      "hoursPerWeek": 4,
      "prerequisites": []
    },
    {
      "code": "PHY101",
      "name": "Engineering Physics",
      "credits": 3,
      "type": "theory",
      "hoursPerWeek": 3,
      "prerequisites": []
    },
    {
      "code": "ENG101",
      "name": "Technical English",
      "credits": 3,
      "type": "theory",
      "hoursPerWeek": 3,
      "prerequisites": []
    },
    {
      "code": "ECE101",
      "name": "Basic Electronics",
      "credits": 4,
      "type": "theory",
      "hoursPerWeek": 4,
      "prerequisites": []
    },
    {
      "code": "ECE102",
      "name": "Electronics Lab",
      "credits": 2,
      "type": "lab",
      "hoursPerWeek": 3,
      "prerequisites": []
    }
  ],
  "teachers": [
    {
      "id": "T001",
      "name": "Dr. Alakh Babbar",
      "department": "Computer Science",
      "specialization": ["Programming", "Algorithms"],
      "maxHoursPerWeek": 20,
      "preferredTimeSlots": ["9:00-10:00", "10:00-11:00", "11:00-12:00"]
    },
    {
      "id": "T002",
      "name": "Prof. Smith Johnson",
      "department": "Mathematics", 
      "specialization": ["Engineering Mathematics", "Calculus"],
      "maxHoursPerWeek": 18,
      "preferredTimeSlots": ["8:00-9:00", "9:00-10:00", "14:00-15:00"]
    },
    {
      "id": "T003",
      "name": "Dr. Sarah Wilson",
      "department": "Physics",
      "specialization": ["Engineering Physics", "Quantum Mechanics"],
      "maxHoursPerWeek": 16,
      "preferredTimeSlots": ["10:00-11:00", "11:00-12:00", "15:00-16:00"]
    },
    {
      "id": "T004",
      "name": "Prof. Michael Brown",
      "department": "English",
      "specialization": ["Technical Writing", "Communication"],
      "maxHoursPerWeek": 15,
      "preferredTimeSlots": ["13:00-14:00", "14:00-15:00", "16:00-17:00"]
    },
    {
      "id": "T005",
      "name": "Dr. Emily Davis",
      "department": "Electronics",
      "specialization": ["Basic Electronics", "Digital Systems"],
      "maxHoursPerWeek": 20,
      "preferredTimeSlots": ["9:00-10:00", "11:00-12:00", "15:00-16:00"]
    }
  ],
  "rooms": [
    {
      "id": "R001",
      "name": "Lecture Theatre 1",
      "type": "lecture_hall",
      "capacity": 100,
      "equipment": ["projector", "microphone", "whiteboard"],
      "building": "Academic Block A"
    },
    {
      "id": "R002",
      "name": "Classroom A101",
      "type": "classroom",
      "capacity": 60,
      "equipment": ["projector", "whiteboard"],
      "building": "Academic Block A"
    },
    {
      "id": "R003",
      "name": "Computer Lab 1",
      "type": "computer_lab",
      "capacity": 30,
      "equipment": ["computers", "projector", "software"],
      "building": "Lab Block"
    },
    {
      "id": "R004",
      "name": "Electronics Lab 1",
      "type": "electronics_lab",
      "capacity": 25,
      "equipment": ["oscilloscopes", "function_generators", "multimeters"],
      "building": "Lab Block"
    },
    {
      "id": "R005",
      "name": "Classroom B201",
      "type": "classroom",
      "capacity": 55,
      "equipment": ["projector", "whiteboard"],
      "building": "Academic Block B"
    },
    {
      "id": "R006",
      "name": "Seminar Hall",
      "type": "seminar_hall",
      "capacity": 80,
      "equipment": ["projector", "audio_system", "whiteboard"],
      "building": "Academic Block A"
    }
  ]
}
```

---

## 📋 **Expected Response Format**

The AI will return timetables in this exact structure:

```json
{
  "success": true,
  "data": {
    "timetables": [
      {
        "class": "btech_cse_1",
        "timetable": {
          "batch": "2024-25",
          "branch": "Computer Science",
          "semester": "1",
          "program": "BTech",
          "type": "full-time", 
          "overallCredits": "24",
          "createdAt": "2025-09-18T...",
          "updatedAt": "2025-09-18T...",
          "monday": {
            "7:00-8:00": {
              "course": "",
              "room": "",
              "teacher": "",
              "conflicts": []
            },
            "8:00-9:00": {
              "course": "Programming Fundamentals",
              "room": "Lecture Theatre 1",
              "teacher": "Dr. Alakh Babbar",
              "conflicts": []
            },
            // ... all other time slots
          },
          "tuesday": {
            // ... all time slots
          },
          // ... all other days
        }
      }
    ],
    "summary": {
      "totalClasses": 2,
      "generatedAt": "2025-09-18T...",
      "conflicts": {
        "total": 0,
        "types": {
          "teacher": 0,
          "room": 0,
          "other": 0
        }
      }
    }
  }
}
```

---

## 🎯 **Testing Steps**

1. **Start Server:**
   ```bash
   cd "/d/my projects/TT-Automation/backend-local"
   npm run dev
   ```

2. **Test Sequence:**
   - GET `/api/timetable/health` - Verify service is running
   - GET `/api/timetable/template` - See expected structure
   - POST `/api/timetable/generate-single` - Test with minimal data
   - POST `/api/timetable/generate` - Test with full data

3. **Key Features to Verify:**
   - ✅ No teacher conflicts (same teacher in multiple places at same time)
   - ✅ No room conflicts (same room assigned to multiple classes)
   - ✅ Credit limits respected (don't exceed overallCredits)
   - ✅ Proper JSON structure returned
   - ✅ All time slots populated correctly

---

## 🔍 **What to Look For**

- **Conflict Detection:** Check if `conflicts` arrays have any entries
- **Credit Management:** Verify total scheduled hours don't exceed `overallCredits`
- **Resource Allocation:** Ensure teachers and rooms are properly distributed
- **Structure Validity:** Confirm all days and time slots are present

The system is now ready to generate conflict-free timetables! 🎉