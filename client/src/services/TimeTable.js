import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const COLLECTION_NAME = 'timetables';

// Time slots configuration
export const TIME_SLOTS = [
  '7:00-8:00',
  '8:00-9:00',
  '9:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-18:00',
  '18:00-19:00'
];

export const WEEKDAYS = [
  'monday',
  'tuesday', 
  'wednesday',
  'thursday',
  'friday',
  'saturday'
];

// Initialize empty timetable structure
export const createEmptyTimetable = () => {
  const timetable = {
    course: '',
    branch: '',
    semester: '',
    type: '', // full-time or part-time
    batch: '',
    createdAt: null,
    updatedAt: null
  };

  // Initialize each weekday with empty time slots
  WEEKDAYS.forEach(day => {
    timetable[day] = {};
    TIME_SLOTS.forEach(slot => {
      timetable[day][slot] = {
        course: '',
        teacher: '',
        room: ''
      };
    });
  });

  return timetable;
};

// Validate timetable data
export const validateTimetableData = (timetableData) => {
  const errors = [];
  
  // Check required fields
  if (!timetableData.course) errors.push('Course is required');
  if (!timetableData.branch) errors.push('Branch is required');
  if (!timetableData.semester) errors.push('Semester is required');
  if (!timetableData.type) errors.push('Type is required');
  // Note: batch is optional - only required when splitting into batches
  
  // Validate type values
  if (timetableData.type && !['full-time', 'part-time'].includes(timetableData.type)) {
    errors.push('Type must be either full-time or part-time');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get all timetables
export const getAllTimetables = async () => {
  try {
    const timetablesRef = collection(db, COLLECTION_NAME);
    const q = query(timetablesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const timetables = [];
    querySnapshot.forEach((doc) => {
      timetables.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      data: timetables
    };
  } catch (error) {
    console.error('Error fetching timetables:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Find timetable by field matching
export const findTimetableByFields = async (course, branch, semester, type, batch = null) => {
  try {
    const timetablesRef = collection(db, COLLECTION_NAME);
    
    // Build query with required fields
    let q = query(
      timetablesRef,
      where('course', '==', course),
      where('branch', '==', branch),
      where('semester', '==', semester),
      where('type', '==', type)
    );
    
    const querySnapshot = await getDocs(q);
    const matches = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Additional batch filtering if provided
      if (batch === null || data.batch === batch || (!data.batch && !batch)) {
        matches.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    return {
      success: true,
      data: matches.length > 0 ? matches[0] : null // Return first match
    };
  } catch (error) {
    console.error('Error finding timetable by fields:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get timetable by ID
export const getTimetableById = async (timetableId) => {
  try {
    if (!timetableId) {
      return {
        success: false,
        error: 'Timetable ID is required'
      };
    }

    const timetablesRef = collection(db, COLLECTION_NAME);
    const q = query(timetablesRef, where('__name__', '==', timetableId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'Timetable not found'
      };
    }

    const doc = querySnapshot.docs[0];
    return {
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    };
  } catch (error) {
    console.error('Error fetching timetable:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Add a new timetable
export const addTimetable = async (timetableData) => {
  try {
    // Validate data
    const validation = validateTimetableData(timetableData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Check if timetable already exists for this combination
    const existingTimetables = await getAllTimetables();
    if (existingTimetables.success) {
      const duplicate = existingTimetables.data.find(tt => 
        tt.course === timetableData.course &&
        tt.branch === timetableData.branch &&
        tt.semester === timetableData.semester &&
        tt.type === timetableData.type &&
        tt.batch === timetableData.batch
      );
      
      if (duplicate) {
        return {
          success: false,
          error: 'Timetable already exists for this combination'
        };
      }
    }

    // Create empty timetable structure if weekdays not provided
    const fullTimetableData = { ...createEmptyTimetable(), ...timetableData };
    
    const timetablesRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(timetablesRef, {
      ...fullTimetableData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      data: { id: docRef.id, ...fullTimetableData }
    };
  } catch (error) {
    console.error('Error adding timetable:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update an existing timetable
export const updateTimetable = async (timetableId, timetableData) => {
  try {
    if (!timetableId) {
      return {
        success: false,
        error: 'Timetable ID is required'
      };
    }

    // Validate data
    const validation = validateTimetableData(timetableData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Check for duplicate (excluding current timetable)
    const existingTimetables = await getAllTimetables();
    if (existingTimetables.success) {
      const duplicate = existingTimetables.data.find(tt => 
        tt.id !== timetableId &&
        tt.course === timetableData.course &&
        tt.branch === timetableData.branch &&
        tt.semester === timetableData.semester &&
        tt.type === timetableData.type &&
        tt.batch === timetableData.batch
      );
      
      if (duplicate) {
        return {
          success: false,
          error: 'Timetable already exists for this combination'
        };
      }
    }

    const timetableRef = doc(db, COLLECTION_NAME, timetableId);
    await updateDoc(timetableRef, {
      ...timetableData,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      data: { id: timetableId, ...timetableData }
    };
  } catch (error) {
    console.error('Error updating timetable:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update specific time slot in timetable
export const updateTimeSlot = async (timetableId, day, timeSlot, slotData) => {
  try {
    if (!timetableId || !day || !timeSlot) {
      return {
        success: false,
        error: 'Timetable ID, day, and time slot are required'
      };
    }

    if (!WEEKDAYS.includes(day)) {
      return {
        success: false,
        error: 'Invalid day. Must be one of: ' + WEEKDAYS.join(', ')
      };
    }

    if (!TIME_SLOTS.includes(timeSlot)) {
      return {
        success: false,
        error: 'Invalid time slot. Must be one of: ' + TIME_SLOTS.join(', ')
      };
    }

    // Get current timetable
    const currentTimetable = await getTimetableById(timetableId);
    if (!currentTimetable.success) {
      return currentTimetable;
    }

    // Check for conflicts before updating
    const conflicts = await checkTimeSlotConflicts(timetableId, day, timeSlot, slotData);
    if (conflicts.length > 0) {
      return {
        success: false,
        error: 'Conflicts detected: ' + conflicts.join(', ')
      };
    }

    // Update the specific time slot
    const updatePath = `${day}.${timeSlot}`;
    const timetableRef = doc(db, COLLECTION_NAME, timetableId);
    
    await updateDoc(timetableRef, {
      [updatePath]: {
        course: slotData.course || '',
        teacher: slotData.teacher || '',
        room: slotData.room || ''
      },
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      data: { day, timeSlot, slotData }
    };
  } catch (error) {
    console.error('Error updating time slot:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete a timetable
export const deleteTimetable = async (timetableId) => {
  try {
    if (!timetableId) {
      return {
        success: false,
        error: 'Timetable ID is required'
      };
    }

    const timetableRef = doc(db, COLLECTION_NAME, timetableId);
    await deleteDoc(timetableRef);
    
    return {
      success: true,
      data: { id: timetableId }
    };
  } catch (error) {
    console.error('Error deleting timetable:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get courses from courses collection
export const getCourses = async () => {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const courses = [];
    querySnapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      data: courses
    };
  } catch (error) {
    console.error('Error fetching courses:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get teachers from teachers collection
export const getTeachers = async () => {
  try {
    const teachersRef = collection(db, 'teachers');
    const q = query(teachersRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const teachers = [];
    querySnapshot.forEach((doc) => {
      teachers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      data: teachers
    };
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get rooms from rooms collection
export const getRooms = async () => {
  try {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const rooms = [];
    querySnapshot.forEach((doc) => {
      rooms.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      data: rooms
    };
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Check for conflicts when assigning time slots
export const checkTimeSlotConflicts = async (timetableId, day, timeSlot, slotData) => {
  try {
    const conflicts = [];
    const allTimetables = await getAllTimetables();
    
    if (!allTimetables.success) {
      return [];
    }

    // Check all timetables for conflicts
    for (const timetable of allTimetables.data) {
      // Skip the current timetable being updated
      if (timetable.id === timetableId) continue;
      
      const daySchedule = timetable[day];
      if (!daySchedule || !daySchedule[timeSlot]) continue;
      
      const existingSlot = daySchedule[timeSlot];
      
      // Check teacher conflict
      if (slotData.teacher && existingSlot.teacher === slotData.teacher) {
        conflicts.push(`Teacher ${slotData.teacher} is already scheduled at ${timeSlot} on ${day}`);
      }
      
      // Check room conflict
      if (slotData.room && existingSlot.room === slotData.room) {
        conflicts.push(`Room ${slotData.room} is already booked at ${timeSlot} on ${day}`);
      }
    }
    
    return conflicts;
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return [];
  }
};

// Real-time conflict detection for temporary timetable data
export const checkRealTimeConflicts = async (currentTimetables, day, timeSlot, slotData, excludeTabId) => {
  try {
    const conflicts = [];
    
    // Check against saved timetables
    const allTimetables = await getAllTimetables();
    if (allTimetables.success) {
      for (const timetable of allTimetables.data) {
        const daySchedule = timetable[day];
        if (!daySchedule || !daySchedule[timeSlot]) continue;
        
        const existingSlot = daySchedule[timeSlot];
        
        // Check teacher conflict
        if (slotData.teacher && existingSlot.teacher === slotData.teacher) {
          conflicts.push({
            type: 'teacher',
            severity: 'high',
            message: `Teacher "${slotData.teacher}" is already scheduled in ${timetable.course} ${timetable.branch} at ${timeSlot} on ${day}`,
            conflictWith: `${timetable.course} ${timetable.branch} (${timetable.semester})`
          });
        }
        
        // Check room conflict
        if (slotData.room && existingSlot.room === slotData.room) {
          conflicts.push({
            type: 'room',
            severity: 'high',
            message: `Room "${slotData.room}" is already booked for ${timetable.course} ${timetable.branch} at ${timeSlot} on ${day}`,
            conflictWith: `${timetable.course} ${timetable.branch} (${timetable.semester})`
          });
        }
      }
    }
    
    // Check against other temporary timetables
    Object.keys(currentTimetables).forEach(tabId => {
      if (tabId === excludeTabId.toString()) return;
      
      const tempTimetable = currentTimetables[tabId];
      if (!tempTimetable || !tempTimetable[day] || !tempTimetable[day][timeSlot]) return;
      
      const existingSlot = tempTimetable[day][timeSlot];
      
      // Check teacher conflict
      if (slotData.teacher && existingSlot.teacher === slotData.teacher) {
        conflicts.push({
          type: 'teacher',
          severity: 'medium',
          message: `Teacher "${slotData.teacher}" is already assigned in another unsaved timetable at ${timeSlot} on ${day}`,
          conflictWith: 'Another timetable tab'
        });
      }
      
      // Check room conflict
      if (slotData.room && existingSlot.room === slotData.room) {
        conflicts.push({
          type: 'room',
          severity: 'medium',
          message: `Room "${slotData.room}" is already assigned in another unsaved timetable at ${timeSlot} on ${day}`,
          conflictWith: 'Another timetable tab'
        });
      }
    });
    
    return conflicts;
  } catch (error) {
    console.error('Error checking real-time conflicts:', error);
    return [];
  }
};

// Get timetable statistics
export const getTimetableStatistics = async () => {
  try {
    const result = await getAllTimetables();
    if (!result.success) {
      return result;
    }

    const timetables = result.data;
    const branches = [...new Set(timetables.map(tt => tt.branch).filter(Boolean))];
    const courses = [...new Set(timetables.map(tt => tt.course).filter(Boolean))];
    const semesters = [...new Set(timetables.map(tt => tt.semester).filter(Boolean))];
    
    // Count filled time slots
    let totalSlots = 0;
    let filledSlots = 0;
    
    timetables.forEach(timetable => {
      WEEKDAYS.forEach(day => {
        if (timetable[day]) {
          TIME_SLOTS.forEach(slot => {
            totalSlots++;
            const timeSlot = timetable[day][slot];
            if (timeSlot && (timeSlot.course || timeSlot.teacher || timeSlot.room)) {
              filledSlots++;
            }
          });
        }
      });
    });

    return {
      success: true,
      data: {
        totalTimetables: timetables.length,
        branches: branches.length,
        courses: courses.length,
        semesters: semesters.length,
        totalSlots,
        filledSlots,
        utilizationRate: totalSlots > 0 ? ((filledSlots / totalSlots) * 100).toFixed(1) : 0
      }
    };
  } catch (error) {
    console.error('Error calculating timetable statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get teacher schedule across all timetables
export const getTeacherSchedule = async (teacherName) => {
  try {
    const allTimetables = await getAllTimetables();
    if (!allTimetables.success) {
      return allTimetables;
    }

    const schedule = {};
    WEEKDAYS.forEach(day => {
      schedule[day] = {};
      TIME_SLOTS.forEach(slot => {
        schedule[day][slot] = [];
      });
    });

    // Find all assignments for this teacher
    allTimetables.data.forEach(timetable => {
      WEEKDAYS.forEach(day => {
        if (timetable[day]) {
          TIME_SLOTS.forEach(slot => {
            const timeSlot = timetable[day][slot];
            if (timeSlot && timeSlot.teacher === teacherName) {
              schedule[day][slot].push({
                course: timeSlot.course,
                room: timeSlot.room,
                timetableInfo: `${timetable.course} - ${timetable.branch} - Sem ${timetable.semester}`
              });
            }
          });
        }
      });
    });

    return {
      success: true,
      data: schedule
    };
  } catch (error) {
    console.error('Error getting teacher schedule:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get room utilization across all timetables
export const getRoomUtilization = async (roomName) => {
  try {
    const allTimetables = await getAllTimetables();
    if (!allTimetables.success) {
      return allTimetables;
    }

    const utilization = {};
    WEEKDAYS.forEach(day => {
      utilization[day] = {};
      TIME_SLOTS.forEach(slot => {
        utilization[day][slot] = [];
      });
    });

    // Find all bookings for this room
    allTimetables.data.forEach(timetable => {
      WEEKDAYS.forEach(day => {
        if (timetable[day]) {
          TIME_SLOTS.forEach(slot => {
            const timeSlot = timetable[day][slot];
            if (timeSlot && timeSlot.room === roomName) {
              utilization[day][slot].push({
                course: timeSlot.course,
                teacher: timeSlot.teacher,
                timetableInfo: `${timetable.course} - ${timetable.branch} - Sem ${timetable.semester}`
              });
            }
          });
        }
      });
    });

    return {
      success: true,
      data: utilization
    };
  } catch (error) {
    console.error('Error getting room utilization:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
