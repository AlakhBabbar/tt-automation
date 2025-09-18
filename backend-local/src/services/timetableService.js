import geminiService from './geminiService.js';

class TimetableGenerationService {
  constructor() {
    this.timeSlots = [
      '7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00',
      '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00',
      '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00'
    ];
    
    this.days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  }

  /**
   * Generate conflict-free timetables for multiple classes
   * @param {Object} inputData - Contains courses, teachers, rooms, classes data
   * @returns {Promise<Array>} Parsed and formatted timetables
   */
  async generateConflictFreeTimetables(inputData) {
    try {
      console.log('Generating timetables for classes:', inputData.classes?.map(c => c.id));
      
      const prompt = this.buildTimetablePrompt(inputData);
      console.log('Sending prompt to AI...');
      
      const aiResponse = await geminiService.generateText(prompt);
      console.log('Received AI response');
      console.log('Raw AI Response:', aiResponse);
      
      // Parse and clean the AI response
      const parsedTimetables = this.parseAIResponse(aiResponse);
      console.log('Parsed timetables:', JSON.stringify(parsedTimetables, null, 2));
      
      // Basic structure validation and cleanup
      const cleanedTimetables = this.cleanupTimetables(parsedTimetables);
      console.log('Cleaned timetables count:', cleanedTimetables.length);
      
      return cleanedTimetables;
    } catch (error) {
      console.error('Error generating timetables:', error);
      throw new Error(`Failed to generate conflict-free timetables: ${error.message}`);
    }
  }

  /**
   * Build comprehensive prompt for AI timetable generation
   */
  buildTimetablePrompt(inputData) {
    const { courses, teachers, rooms, classes } = inputData;

    return `
You are a professional timetable scheduling expert. Generate conflict-free timetables for educational institutions.

CRITICAL REQUIREMENTS:
1. NO CONFLICTS: Each teacher can only be in one place at one time
2. NO ROOM DOUBLE-BOOKING: Each room can only have one class at a time
3. RESPECT CREDIT LIMITS: Don't exceed the overall credits specified for each class
4. MANDATORY JSON FORMAT: Return ONLY valid JSON, no explanations

INPUT DATA:
Classes: ${JSON.stringify(classes, null, 2)}
Courses: ${JSON.stringify(courses, null, 2)}
Teachers: ${JSON.stringify(teachers, null, 2)}
Rooms: ${JSON.stringify(rooms, null, 2)}

REQUIRED OUTPUT FORMAT:
Return a JSON array where each object represents a class timetable in this EXACT structure:

[
  {
    "class": "class_identifier",
    "timetable": {
      "batch": "batch_name",
      "branch": "branch_name",
      "createdAt": "current_timestamp",
      "semester": "semester_number",
      "program": "program_name",
      "type": "full-time",
      "overallCredits": "total_credits",
      "updatedAt": "current_timestamp",
      "monday": {
        "7:00-8:00": {
          "course": "course_name_or_empty",
          "room": "room_name_or_empty",
          "teacher": "teacher_name_or_empty",
          "conflicts": []
        },
        "8:00-9:00": {
          "course": "course_name_or_empty",
          "room": "room_name_or_empty", 
          "teacher": "teacher_name_or_empty",
          "conflicts": []
        },
        "9:00-10:00": {
          "course": "course_name_or_empty",
          "room": "room_name_or_empty",
          "teacher": "teacher_name_or_empty", 
          "conflicts": []
        },
        "10:00-11:00": {
          "course": "course_name_or_empty",
          "room": "room_name_or_empty",
          "teacher": "teacher_name_or_empty",
          "conflicts": []
        },
        "11:00-12:00": {
          "course": "course_name_or_empty",
          "room": "room_name_or_empty",
          "teacher": "teacher_name_or_empty",
          "conflicts": []
        },
        "12:00-13:00": {
          "course": "course_name_or_empty",
          "room": "room_name_or_empty",
          "teacher": "teacher_name_or_empty",
          "conflicts": []
        },
        "13:00-14:00": {
          "course": "course_name_or_empty",
          "room": "room_name_or_empty",
          "teacher": "teacher_name_or_empty",
          "conflicts": []
        },
        "14:00-15:00": {
          "course": "course_name_or_empty",
          "room": "room_name_or_empty",
          "teacher": "teacher_name_or_empty",
          "conflicts": []
        },
        "15:00-16:00": {
          "course": "course_name_or_empty",
          "room": "room_name_or_empty",
          "teacher": "teacher_name_or_empty",
          "conflicts": []
        },
        "16:00-17:00": {
          "course": "course_name_or_empty",
          "room": "room_name_or_empty",
          "teacher": "teacher_name_or_empty",
          "conflicts": []
        },
        "17:00-18:00": {
          "course": "course_name_or_empty",
          "room": "room_name_or_empty",
          "teacher": "teacher_name_or_empty",
          "conflicts": []
        },
        "18:00-19:00": {
          "course": "course_name_or_empty",
          "room": "room_name_or_empty",
          "teacher": "teacher_name_or_empty",
          "conflicts": []
        }
      },
      "tuesday": {
        // Same structure as monday for all 12 time slots
      },
      "wednesday": {
        // Same structure as monday for all 12 time slots  
      },
      "thursday": {
        // Same structure as monday for all 12 time slots
      },
      "friday": {
        // Same structure as monday for all 12 time slots
      },
      "saturday": {
        // Same structure as monday for all 12 time slots
      }
    }
  }
]

SCHEDULING RULES:
1. Use empty strings ("") for course, room, teacher when no class is scheduled
2. Keep conflicts array empty ([]) for conflict-free schedules
3. Distribute courses evenly across the week
4. Ensure teacher availability (no double booking)
5. Ensure room availability (no double booking)
6. Respect course credit hours and overall credit limits
7. Include current timestamp for createdAt and updatedAt

Generate the complete timetable structure for all provided classes. Return ONLY the JSON array, no additional text.
`;
  }

  /**
   * Parse AI response and convert to structured timetable data
   */
  parseAIResponse(aiResponse) {
    try {
      // Remove any markdown code blocks or extra text
      let cleanResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Try to find JSON array in the response
      const jsonStart = cleanResponse.indexOf('[');
      const jsonEnd = cleanResponse.lastIndexOf(']') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
      }
      
      const parsedData = JSON.parse(cleanResponse);
      
      if (!Array.isArray(parsedData)) {
        throw new Error('Response is not an array');
      }
      
      return parsedData;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw AI Response:', aiResponse);
      throw new Error('Failed to parse AI response as valid JSON');
    }
  }

  /**
   * Validate generated timetables for conflicts and constraints
   */
  validateTimetables(timetables, inputData) {
    const validatedTimetables = [];
    
    for (const timetableData of timetables) {
      const validatedTimetable = this.validateSingleTimetable(timetableData, inputData);
      validatedTimetables.push(validatedTimetable);
    }
    
    // Cross-validate for teacher and room conflicts across all timetables
    this.validateCrossTableConflicts(validatedTimetables);
    
    return validatedTimetables;
  }

  /**
   * Validate a single timetable structure and data
   */
  validateSingleTimetable(timetableData, inputData) {
    // Ensure required structure exists
    if (!timetableData.timetable) {
      throw new Error('Invalid timetable structure: missing timetable object');
    }

    // Add current timestamps if missing
    const currentTimestamp = new Date().toISOString();
    if (!timetableData.timetable.createdAt) {
      timetableData.timetable.createdAt = currentTimestamp;
    }
    if (!timetableData.timetable.updatedAt) {
      timetableData.timetable.updatedAt = currentTimestamp;
    }

    // Validate all days exist
    for (const day of this.days) {
      if (!timetableData.timetable[day]) {
        timetableData.timetable[day] = this.createEmptyDaySchedule();
      }
    }

    // Validate all time slots exist for each day
    for (const day of this.days) {
      for (const timeSlot of this.timeSlots) {
        if (!timetableData.timetable[day][timeSlot]) {
          timetableData.timetable[day][timeSlot] = {
            course: "",
            room: "",
            teacher: "",
            conflicts: []
          };
        }
      }
    }

    return timetableData;
  }

  /**
   * Check for teacher and room conflicts across all timetables
   */
  validateCrossTableConflicts(timetables) {
    for (const day of this.days) {
      for (const timeSlot of this.timeSlots) {
        const teacherMap = new Map();
        const roomMap = new Map();
        
        // Collect all teachers and rooms for this time slot
        timetables.forEach((timetableData, index) => {
          const slot = timetableData.timetable[day][timeSlot];
          if (slot.teacher && slot.teacher !== "") {
            if (teacherMap.has(slot.teacher)) {
              // Teacher conflict detected
              teacherMap.get(slot.teacher).push(index);
              slot.conflicts.push(`Teacher conflict: ${slot.teacher} assigned to multiple classes`);
            } else {
              teacherMap.set(slot.teacher, [index]);
            }
          }
          
          if (slot.room && slot.room !== "") {
            if (roomMap.has(slot.room)) {
              // Room conflict detected
              roomMap.get(slot.room).push(index);
              slot.conflicts.push(`Room conflict: ${slot.room} assigned to multiple classes`);
            } else {
              roomMap.set(slot.room, [index]);
            }
          }
        });
      }
    }
  }

  /**
   * Create empty day schedule with all time slots
   */
  createEmptyDaySchedule() {
    const daySchedule = {};
    for (const timeSlot of this.timeSlots) {
      daySchedule[timeSlot] = {
        course: "",
        room: "",
        teacher: "",
        conflicts: []
      };
    }
    return daySchedule;
  }

  /**
   * Clean up parsed timetables to ensure proper structure
   */
  cleanupTimetables(timetables) {
    if (!Array.isArray(timetables)) {
      console.warn('Timetables is not an array, wrapping in array');
      timetables = [timetables];
    }

    return timetables.map((timetableData, index) => {
      console.log(`Cleaning timetable ${index + 1}:`, timetableData.class || 'unnamed');
      
      // Ensure required structure exists
      if (!timetableData.timetable) {
        console.warn(`Timetable ${index + 1} missing timetable object, creating empty structure`);
        timetableData.timetable = {};
      }

      // Add current timestamps if missing
      const currentTimestamp = new Date().toISOString();
      if (!timetableData.timetable.createdAt) {
        timetableData.timetable.createdAt = currentTimestamp;
      }
      if (!timetableData.timetable.updatedAt) {
        timetableData.timetable.updatedAt = currentTimestamp;
      }

      // Ensure all days exist
      for (const day of this.days) {
        if (!timetableData.timetable[day]) {
          console.log(`Adding missing day: ${day}`);
          timetableData.timetable[day] = this.createEmptyDaySchedule();
        }
      }

      // Validate all time slots exist for each day
      for (const day of this.days) {
        for (const timeSlot of this.timeSlots) {
          if (!timetableData.timetable[day][timeSlot]) {
            timetableData.timetable[day][timeSlot] = {
              course: "",
              room: "",
              teacher: "",
              conflicts: []
            };
          }
        }
      }

      return timetableData;
    });
  }

  /**
   * Generate a single timetable for testing
   */
  async generateSingleTimetable(classData, courses, teachers, rooms) {
    const inputData = {
      classes: [classData],
      courses,
      teachers,
      rooms
    };
    
    const timetables = await this.generateConflictFreeTimetables(inputData);
    return timetables[0];
  }
}

export default new TimetableGenerationService();