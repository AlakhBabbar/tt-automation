/**
 * Utility functions for timetable operations
 */

class TimetableUtils {
  static timeSlots = [
    '7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00',
    '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00',
    '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00'
  ];

  static days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  /**
   * Create sample input data for testing
   */
  static createSampleInputData() {
    return {
      classes: [
        {
          id: "btech_cse_1",
          batch: "2024-25",
          branch: "Computer Science",
          semester: "1",
          program: "BTech",
          type: "full-time",
          overallCredits: "24",
          students: 60
        },
        {
          id: "btech_ece_1", 
          batch: "2024-25",
          branch: "Electronics",
          semester: "1", 
          program: "BTech",
          type: "full-time",
          overallCredits: "24",
          students: 55
        }
      ],
      courses: [
        {
          code: "CS101",
          name: "Programming Fundamentals",
          credits: 4,
          type: "theory",
          hoursPerWeek: 4,
          prerequisites: []
        },
        {
          code: "CS102",
          name: "Programming Lab",
          credits: 2,
          type: "lab",
          hoursPerWeek: 3,
          prerequisites: []
        },
        {
          code: "MATH101",
          name: "Engineering Mathematics",
          credits: 4,
          type: "theory",
          hoursPerWeek: 4,
          prerequisites: []
        },
        {
          code: "PHY101",
          name: "Engineering Physics",
          credits: 3,
          type: "theory",
          hoursPerWeek: 3,
          prerequisites: []
        },
        {
          code: "ENG101",
          name: "Technical English",
          credits: 3,
          type: "theory",
          hoursPerWeek: 3,
          prerequisites: []
        },
        {
          code: "ECE101",
          name: "Basic Electronics",
          credits: 4,
          type: "theory",
          hoursPerWeek: 4,
          prerequisites: []
        },
        {
          code: "ECE102",
          name: "Electronics Lab",
          credits: 2,
          type: "lab",
          hoursPerWeek: 3,
          prerequisites: []
        }
      ],
      teachers: [
        {
          id: "T001",
          name: "Dr. Alakh Babbar",
          department: "Computer Science",
          specialization: ["Programming", "Algorithms"],
          maxHoursPerWeek: 20,
          preferredTimeSlots: ["9:00-10:00", "10:00-11:00", "11:00-12:00"]
        },
        {
          id: "T002", 
          name: "Prof. Smith Johnson",
          department: "Mathematics",
          specialization: ["Engineering Mathematics", "Calculus"],
          maxHoursPerWeek: 18,
          preferredTimeSlots: ["8:00-9:00", "9:00-10:00", "14:00-15:00"]
        },
        {
          id: "T003",
          name: "Dr. Sarah Wilson",
          department: "Physics", 
          specialization: ["Engineering Physics", "Quantum Mechanics"],
          maxHoursPerWeek: 16,
          preferredTimeSlots: ["10:00-11:00", "11:00-12:00", "15:00-16:00"]
        },
        {
          id: "T004",
          name: "Prof. Michael Brown",
          department: "English",
          specialization: ["Technical Writing", "Communication"],
          maxHoursPerWeek: 15,
          preferredTimeSlots: ["13:00-14:00", "14:00-15:00", "16:00-17:00"]
        },
        {
          id: "T005",
          name: "Dr. Emily Davis",
          department: "Electronics",
          specialization: ["Basic Electronics", "Digital Systems"],
          maxHoursPerWeek: 20,
          preferredTimeSlots: ["9:00-10:00", "11:00-12:00", "15:00-16:00"]
        }
      ],
      rooms: [
        {
          id: "R001",
          name: "Lecture Theatre 1",
          type: "lecture_hall",
          capacity: 100,
          equipment: ["projector", "microphone", "whiteboard"],
          building: "Academic Block A"
        },
        {
          id: "R002",
          name: "Classroom A101",
          type: "classroom",
          capacity: 60,
          equipment: ["projector", "whiteboard"],
          building: "Academic Block A"
        },
        {
          id: "R003",
          name: "Computer Lab 1",
          type: "computer_lab",
          capacity: 30,
          equipment: ["computers", "projector", "software"],
          building: "Lab Block"
        },
        {
          id: "R004",
          name: "Electronics Lab 1",
          type: "electronics_lab", 
          capacity: 25,
          equipment: ["oscilloscopes", "function_generators", "multimeters"],
          building: "Lab Block"
        },
        {
          id: "R005",
          name: "Classroom B201",
          type: "classroom",
          capacity: 55,
          equipment: ["projector", "whiteboard"],
          building: "Academic Block B"
        },
        {
          id: "R006",
          name: "Seminar Hall",
          type: "seminar_hall",
          capacity: 80,
          equipment: ["projector", "audio_system", "whiteboard"],
          building: "Academic Block A"
        }
      ]
    };
  }

  /**
   * Create minimal test data for quick testing
   */
  static createMinimalTestData() {
    return {
      classes: [
        {
          id: "test_class_1",
          batch: "2024-25",
          branch: "Computer Science",
          semester: "1",
          program: "BTech",
          type: "full-time",
          overallCredits: "12"
        }
      ],
      courses: [
        {
          code: "CS101",
          name: "Programming Fundamentals",
          credits: 4,
          hoursPerWeek: 4
        },
        {
          code: "MATH101", 
          name: "Engineering Mathematics",
          credits: 4,
          hoursPerWeek: 4
        },
        {
          code: "ENG101",
          name: "Technical English", 
          credits: 3,
          hoursPerWeek: 3
        }
      ],
      teachers: [
        {
          id: "T001",
          name: "Dr. Alakh Babbar",
          maxHoursPerWeek: 20
        },
        {
          id: "T002",
          name: "Prof. Smith",
          maxHoursPerWeek: 18
        },
        {
          id: "T003",
          name: "Dr. Sarah",
          maxHoursPerWeek: 16
        }
      ],
      rooms: [
        {
          id: "R001",
          name: "Lecture Theatre 1",
          capacity: 100
        },
        {
          id: "R002", 
          name: "Classroom A101",
          capacity: 60
        }
      ]
    };
  }

  /**
   * Validate timetable structure
   */
  static validateTimetableStructure(timetable) {
    const errors = [];

    if (!timetable.class) {
      errors.push("Missing 'class' field");
    }

    if (!timetable.timetable) {
      errors.push("Missing 'timetable' object");
      return { isValid: false, errors };
    }

    const requiredFields = ['batch', 'branch', 'semester', 'program', 'type', 'overallCredits'];
    for (const field of requiredFields) {
      if (!timetable.timetable[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check days
    for (const day of this.days) {
      if (!timetable.timetable[day]) {
        errors.push(`Missing day: ${day}`);
        continue;
      }

      // Check time slots for each day
      for (const timeSlot of this.timeSlots) {
        if (!timetable.timetable[day][timeSlot]) {
          errors.push(`Missing time slot ${timeSlot} for ${day}`);
          continue;
        }

        const slot = timetable.timetable[day][timeSlot];
        if (typeof slot.course !== 'string') {
          errors.push(`Invalid course field in ${day} ${timeSlot}`);
        }
        if (typeof slot.room !== 'string') {
          errors.push(`Invalid room field in ${day} ${timeSlot}`);
        }
        if (typeof slot.teacher !== 'string') {
          errors.push(`Invalid teacher field in ${day} ${timeSlot}`);
        }
        if (!Array.isArray(slot.conflicts)) {
          errors.push(`Invalid conflicts field in ${day} ${timeSlot}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Count total scheduled hours in a timetable
   */
  static countScheduledHours(timetable) {
    let totalHours = 0;
    
    for (const day of this.days) {
      if (timetable.timetable[day]) {
        for (const timeSlot of this.timeSlots) {
          const slot = timetable.timetable[day][timeSlot];
          if (slot && slot.course && slot.course !== "") {
            totalHours++;
          }
        }
      }
    }
    
    return totalHours;
  }

  /**
   * Get all conflicts from a timetable
   */
  static getAllConflicts(timetable) {
    const conflicts = [];
    
    for (const day of this.days) {
      if (timetable.timetable[day]) {
        for (const timeSlot of this.timeSlots) {
          const slot = timetable.timetable[day][timeSlot];
          if (slot && slot.conflicts && slot.conflicts.length > 0) {
            conflicts.push({
              day,
              timeSlot,
              conflicts: slot.conflicts
            });
          }
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Format timetable for display
   */
  static formatTimetableForDisplay(timetable) {
    const formatted = {
      classInfo: {
        class: timetable.class,
        batch: timetable.timetable.batch,
        branch: timetable.timetable.branch,
        semester: timetable.timetable.semester,
        program: timetable.timetable.program,
        overallCredits: timetable.timetable.overallCredits
      },
      schedule: {},
      statistics: {
        totalScheduledHours: this.countScheduledHours(timetable),
        totalConflicts: this.getAllConflicts(timetable).length
      }
    };

    for (const day of this.days) {
      formatted.schedule[day] = [];
      if (timetable.timetable[day]) {
        for (const timeSlot of this.timeSlots) {
          const slot = timetable.timetable[day][timeSlot];
          if (slot && slot.course && slot.course !== "") {
            formatted.schedule[day].push({
              time: timeSlot,
              course: slot.course,
              teacher: slot.teacher,
              room: slot.room,
              hasConflicts: slot.conflicts.length > 0
            });
          }
        }
      }
    }

    return formatted;
  }
}

export default TimetableUtils;