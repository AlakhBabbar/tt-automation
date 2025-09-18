import timetableService from '../services/timetableService.js';

class TimetableController {
  /**
   * Generate conflict-free timetables for multiple classes
   */
  async generateTimetables(req, res) {
    try {
      const { classes, courses, teachers, rooms } = req.body;
      
      // Generate timetables using AI service
      const timetables = await timetableService.generateConflictFreeTimetables({
        classes,
        courses,
        teachers,
        rooms
      });

      res.json({
        success: true,
        data: {
          timetables: timetables,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in generateTimetables controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate timetables',
        details: error.message
      });
    }
  }

  /**
   * Generate a single timetable for testing
   */
  async generateSingleTimetable(req, res) {
    try {
      const { classData, courses, teachers, rooms } = req.body;
      
      if (!classData) {
        return res.status(400).json({
          success: false,
          error: 'Class data is required'
        });
      }

      const timetable = await timetableService.generateSingleTimetable(
        classData,
        courses || [],
        teachers || [],
        rooms || []
      );

      res.json({
        success: true,
        data: {
          timetable: timetable,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in generateSingleTimetable controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate single timetable',
        details: error.message
      });
    }
  }

  /**
   * Validate timetable input data
   */
  validateInputData({ classes, courses, teachers, rooms }) {
    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      return {
        isValid: false,
        error: 'Classes array is required and must not be empty'
      };
    }

    if (!courses || !Array.isArray(courses)) {
      return {
        isValid: false,
        error: 'Courses array is required'
      };
    }

    if (!teachers || !Array.isArray(teachers)) {
      return {
        isValid: false,
        error: 'Teachers array is required'
      };
    }

    if (!rooms || !Array.isArray(rooms)) {
      return {
        isValid: false,
        error: 'Rooms array is required'
      };
    }

    // Validate each class has required fields
    for (let i = 0; i < classes.length; i++) {
      const classData = classes[i];
      if (!classData.batch || !classData.branch || !classData.semester) {
        return {
          isValid: false,
          error: `Class ${i + 1} must have batch, branch, and semester fields`
        };
      }
    }

    // Validate courses have required fields
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      if (!course.name || !course.code) {
        return {
          isValid: false,
          error: `Course ${i + 1} must have name and code fields`
        };
      }
    }

    // Validate teachers have required fields
    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      if (!teacher.name) {
        return {
          isValid: false,
          error: `Teacher ${i + 1} must have name field`
        };
      }
    }

    // Validate rooms have required fields
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      if (!room.name) {
        return {
          isValid: false,
          error: `Room ${i + 1} must have name field`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Count conflicts in generated timetables
   */
  countConflicts(timetables) {
    let totalConflicts = 0;
    const conflictTypes = {
      teacher: 0,
      room: 0,
      other: 0
    };

    timetables.forEach(timetableData => {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      days.forEach(day => {
        if (timetableData.timetable[day]) {
          Object.values(timetableData.timetable[day]).forEach(slot => {
            if (slot.conflicts && slot.conflicts.length > 0) {
              totalConflicts += slot.conflicts.length;
              slot.conflicts.forEach(conflict => {
                if (conflict.toLowerCase().includes('teacher')) {
                  conflictTypes.teacher++;
                } else if (conflict.toLowerCase().includes('room')) {
                  conflictTypes.room++;
                } else {
                  conflictTypes.other++;
                }
              });
            }
          });
        }
      });
    });

    return {
      total: totalConflicts,
      types: conflictTypes
    };
  }

  /**
   * Get timetable template structure
   */
  async getTimetableTemplate(req, res) {
    try {
      const template = {
        class: "example_class_id",
        timetable: {
          batch: "batch_name",
          branch: "branch_name", 
          semester: "semester_number",
          program: "program_name",
          type: "full-time",
          overallCredits: "total_credits",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          monday: {},
          tuesday: {},
          wednesday: {},
          thursday: {},
          friday: {},
          saturday: {}
        }
      };

      // Add time slots for each day
      const timeSlots = [
        '7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00',
        '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00',
        '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00'
      ];

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      days.forEach(day => {
        template.timetable[day] = {};
        timeSlots.forEach(timeSlot => {
          template.timetable[day][timeSlot] = {
            course: "",
            room: "",
            teacher: "",
            conflicts: []
          };
        });
      });

      res.json({
        success: true,
        data: {
          template: template,
          timeSlots: timeSlots,
          days: days
        }
      });
    } catch (error) {
      console.error('Error in getTimetableTemplate controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get timetable template'
      });
    }
  }

  /**
   * Health check for timetable service
   */
  async healthCheck(req, res) {
    try {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          message: 'Timetable generation service is operational',
          features: [
            'Conflict-free scheduling',
            'Credit limit management', 
            'Multi-class generation',
            'Teacher/Room conflict detection'
          ]
        }
      });
    } catch (error) {
      console.error('Error in timetable health check:', error);
      res.status(500).json({
        success: false,
        error: 'Timetable service health check failed'
      });
    }
  }
}

export default new TimetableController();