import { TIME_SLOTS, WEEKDAYS } from './TimeTable';

/**
 * Conflict Detection and Management Service
 * 
 * This service handles:
 * 1. Teacher conflicts - when same teacher is assigned to multiple classes at same time
 * 2. Room conflicts - when same room is assigned to multiple classes at same time
 * 3. Real-time conflict checking during timetable creation
 * 4. Conflict resolution and cross-checking for fetched timetables
 */

// Priority order for conflict checking:
// 1. Unsaved vs Unsaved (highest priority)
// 2. Unsaved vs Saved 
// 3. Saved vs Saved (lowest priority)

/**
 * Create a conflict object for embedding in time slots
 * @param {string} conflictType - 'teacher' or 'room'
 * @param {Object} conflictingTimetable - The timetable causing the conflict
 * @param {Object} currentSlot - The current slot data
 * @param {Object} conflictingSlot - The conflicting slot data
 * @param {boolean} ignorable - Whether this conflict can be ignored
 * @returns {Object} Conflict object for embedding in time slot
 */
export const createConflict = (conflictType, conflictingTimetable, currentSlot, conflictingSlot, ignorable = false) => {
  let conflictingResource = '';
  if (conflictType === 'teacher') {
    conflictingResource = currentSlot.teacher;
  } else if (conflictType === 'room') {
    conflictingResource = currentSlot.room;
  }

  return {
    conflictType,
    conflictingResource, // The teacher/room that's causing the conflict
    conflictingCourse: conflictingSlot.course, // The course in the conflicting timetable
    program: conflictingTimetable.program,
    branch: conflictingTimetable.branch,
    semester: conflictingTimetable.semester,
    batch: conflictingTimetable.batch || '',
    type: conflictingTimetable.type, // academic type (full-time/part-time)
    ignorable
  };
};

/**
 * Check if two time slots have a teacher conflict
 * @param {Object} slot1 - First time slot
 * @param {Object} slot2 - Second time slot
 * @returns {boolean} True if there's a teacher conflict
 */
export const hasTeacherConflict = (slot1, slot2) => {
  if (!slot1?.teacher || !slot2?.teacher) return false;
  const teacher1 = slot1.teacher.trim();
  const teacher2 = slot2.teacher.trim();
  
  // Don't match empty or very short teacher names (likely incomplete data)
  if (teacher1.length < 2 || teacher2.length < 2) return false;
  
  return teacher1.toLowerCase() === teacher2.toLowerCase();
};

/**
 * Check if two time slots have a room conflict
 * @param {Object} slot1 - First time slot
 * @param {Object} slot2 - Second time slot
 * @returns {boolean} True if there's a room conflict
 */
export const hasRoomConflict = (slot1, slot2) => {
  if (!slot1?.room || !slot2?.room) return false;
  const room1 = slot1.room.trim();
  const room2 = slot2.room.trim();
  
  // Don't match empty or very short room names (likely incomplete data)
  if (room1.length < 1 || room2.length < 1) return false;
  
  return room1.toLowerCase() === room2.toLowerCase();
};

/**
 * Validate if a timetable has complete basic information
 * @param {Object} timetable - Timetable to validate
 * @returns {boolean} True if timetable is valid for conflict checking
 */
export const isValidTimetableForConflictCheck = (timetable) => {
  if (!timetable) return false;
  
  const requiredFields = ['program', 'branch', 'semester', 'type'];
  for (const field of requiredFields) {
    if (!timetable[field] || typeof timetable[field] !== 'string' || timetable[field].trim().length === 0) {
      return false;
    }
  }
  
  return true;
};

/**
 * Get timetable identifier string
 * @param {Object} timetable - Timetable object
 * @returns {string} Unique identifier
 */
export const getTimetableIdentifier = (timetable) => {
  const batch = timetable.batch ? `-${timetable.batch}` : '';
  return `${timetable.program}-${timetable.branch}-Sem${timetable.semester}-${timetable.type}${batch}`;
};

/**
 * Check conflicts for a specific time slot against a list of timetables
 * @param {string} day - Day of the week
 * @param {string} timeSlot - Time slot
 * @param {Object} slotData - The slot data to check
 * @param {Array} timetablesToCheck - Array of timetables to check against
 * @param {string} excludeTimetableId - Timetable ID to exclude from checking
 * @returns {Array} Array of conflicts found
 */
export const checkSlotConflicts = (day, timeSlot, slotData, timetablesToCheck, excludeTimetableId = null) => {
  const conflicts = [];
  
  console.log(`Checking slot conflicts for ${day} ${timeSlot}:`, {
    slotData,
    timetablesToCheck: timetablesToCheck.length,
    excludeTimetableId
  });
  
  for (const timetable of timetablesToCheck) {
    // Skip if this is the same timetable we're checking
    if (excludeTimetableId && timetable.id === excludeTimetableId) continue;
    
    // Skip if timetable doesn't have this day or time slot
    if (!timetable[day] || !timetable[day][timeSlot]) continue;
    
    // Skip timetables with incomplete basic information
    if (!isValidTimetableForConflictCheck(timetable)) {
      console.log(`Skipping invalid timetable:`, timetable.id, {
        program: timetable.program,
        branch: timetable.branch,
        semester: timetable.semester,
        type: timetable.type
      });
      continue;
    }
    
    const existingSlot = timetable[day][timeSlot];
    
    // Skip empty slots in the conflicting timetable
    if (!existingSlot || (!existingSlot.teacher && !existingSlot.room)) {
      continue;
    }
    
    console.log(`Comparing with ${timetable.program}-${timetable.branch}:`, existingSlot);
    
    // Check teacher conflict
    if (hasTeacherConflict(slotData, existingSlot)) {
      console.log(`Teacher conflict found: ${slotData.teacher} with ${timetable.program}-${timetable.branch}`);
      const conflict = createConflict('teacher', timetable, slotData, existingSlot, false);
      console.log('Created teacher conflict:', conflict);
      conflicts.push(conflict);
    }
    
    // Check room conflict
    if (hasRoomConflict(slotData, existingSlot)) {
      console.log(`Room conflict found: ${slotData.room} with ${timetable.program}-${timetable.branch}`);
      const conflict = createConflict('room', timetable, slotData, existingSlot, false);
      console.log('Created room conflict:', conflict);
      conflicts.push(conflict);
    }
  }
  
  console.log(`Found ${conflicts.length} conflicts for ${day} ${timeSlot}`);
  return conflicts;
};

/**
 * Check and embed conflicts directly into a timetable structure
 * @param {Object} timetableToCheck - The timetable to check for conflicts
 * @param {Array} savedTimetables - Array of saved timetables
 * @param {Array} unsavedTimetables - Array of unsaved timetables
 * @returns {Object} Timetable with conflicts embedded in time slots
 */
export const embedConflictsInTimetable = (timetableToCheck, savedTimetables = [], unsavedTimetables = []) => {
  const updatedTimetable = JSON.parse(JSON.stringify(timetableToCheck)); // Deep clone
  const checkedTimetableIds = new Set();
  
  // Add the current timetable to checked set to avoid self-checking
  if (timetableToCheck.id) {
    checkedTimetableIds.add(timetableToCheck.id);
  }
  
  WEEKDAYS.forEach(day => {
    TIME_SLOTS.forEach(timeSlot => {
      const slotData = updatedTimetable[day]?.[timeSlot];
      
      // Skip empty slots
      if (!slotData || (!slotData.teacher && !slotData.room)) {
        if (slotData) slotData.conflicts = [];
        return;
      }
      
      const allSlotConflicts = [];
      
      // Priority 1: Check against other unsaved timetables (highest priority)
      const otherUnsavedTimetables = unsavedTimetables.filter(tt => 
        !checkedTimetableIds.has(tt.id) && tt.id !== timetableToCheck.id
      );
      
      const unsavedConflicts = checkSlotConflicts(day, timeSlot, slotData, otherUnsavedTimetables);
      allSlotConflicts.push(...unsavedConflicts);
      
      // Priority 2: Check against saved timetables (if no unsaved conflicts for same resource)
      const savedToCheck = savedTimetables.filter(tt => !checkedTimetableIds.has(tt.id));
      const savedConflicts = checkSlotConflicts(day, timeSlot, slotData, savedToCheck);
      
      // Only add saved conflicts if we don't have unsaved conflicts for the same resource type
      savedConflicts.forEach(savedConflict => {
        const hasUnsavedForSameType = unsavedConflicts.some(unsaved => 
          unsaved.conflictType === savedConflict.conflictType
        );
        if (!hasUnsavedForSameType) {
          allSlotConflicts.push(savedConflict);
        }
      });
      
      // Embed all conflicts into the slot
      slotData.conflicts = allSlotConflicts;
    });
  });
  
  return updatedTimetable;
};

/**
 * Check conflicts for an entire timetable (legacy function for compatibility)
 * @param {Object} timetableToCheck - The timetable to check for conflicts
 * @param {Array} savedTimetables - Array of saved timetables
 * @param {Array} unsavedTimetables - Array of unsaved timetables
 * @returns {Object} Conflicts organized by day and time slot (for UI display)
 */
export const checkTimetableConflicts = (timetableToCheck, savedTimetables = [], unsavedTimetables = []) => {
  const allConflicts = {};
  const checkedTimetableIds = new Set();
  
  // Add the current timetable to checked set to avoid self-checking
  if (timetableToCheck.id) {
    checkedTimetableIds.add(timetableToCheck.id);
  }
  
  WEEKDAYS.forEach(day => {
    allConflicts[day] = {};
    
    TIME_SLOTS.forEach(timeSlot => {
      const slotData = timetableToCheck[day]?.[timeSlot];
      
      // Skip empty slots
      if (!slotData || (!slotData.teacher && !slotData.room)) {
        allConflicts[day][timeSlot] = [];
        return;
      }
      
      const conflicts = [];
      
      // Priority 1: Check against other unsaved timetables
      const otherUnsavedTimetables = unsavedTimetables.filter(tt => 
        !checkedTimetableIds.has(tt.id) && tt.id !== timetableToCheck.id
      );
      
      conflicts.push(...checkSlotConflicts(day, timeSlot, slotData, otherUnsavedTimetables));
      
      // Priority 2: Check against saved timetables (excluding those already checked)
      const savedToCheck = savedTimetables.filter(tt => !checkedTimetableIds.has(tt.id));
      conflicts.push(...checkSlotConflicts(day, timeSlot, slotData, savedToCheck));
      
      allConflicts[day][timeSlot] = conflicts;
    });
  });
  
  return allConflicts;
};

/**
 * Extract conflicts from embedded timetable structure for UI display
 * @param {Object} timetableWithEmbeddedConflicts - Timetable with conflicts embedded in slots
 * @returns {Object} Conflicts organized by day and time slot with display properties
 */
export const extractConflictsForDisplay = (timetableWithEmbeddedConflicts) => {
  const displayConflicts = {};
  
  WEEKDAYS.forEach(day => {
    displayConflicts[day] = {};
    
    TIME_SLOTS.forEach(timeSlot => {
      const slotData = timetableWithEmbeddedConflicts[day]?.[timeSlot];
      const conflicts = [];
      
      if (slotData?.conflicts && slotData.conflicts.length > 0) {
        slotData.conflicts.forEach(conflict => {
          // Validate conflict data and provide fallbacks for missing information
          const program = conflict.program || 'Unknown Program';
          const branch = conflict.branch || 'Unknown Branch';
          const semester = conflict.semester || 'Unknown Semester';
          const batch = conflict.batch ? ` (${conflict.batch})` : '';
          
          const conflictDetails = `${program} ${branch} - Sem ${semester}${batch}`;
          
          let message = '';
          if (conflict.conflictType === 'teacher') {
            message = `Teacher "${conflict.conflictingResource}" is already teaching "${conflict.conflictingCourse || 'Unknown Course'}" for ${conflictDetails}`;
          } else if (conflict.conflictType === 'room') {
            message = `Room "${conflict.conflictingResource}" is already booked for "${conflict.conflictingCourse || 'Unknown Course'}" by ${conflictDetails}`;
          } else {
            message = `Conflict with ${conflictDetails}`;
          }
          
          conflicts.push({
            type: conflict.conflictType,
            message,
            severity: 'high',
            program: conflict.program,
            branch: conflict.branch,
            semester: conflict.semester,
            batch: conflict.batch,
            programType: conflict.type,
            conflictingResource: conflict.conflictingResource,
            conflictingCourse: conflict.conflictingCourse,
            ignorable: conflict.ignorable
          });
        });
      }
      
      displayConflicts[day][timeSlot] = conflicts;
    });
  });
  
  return displayConflicts;
};

/**
 * Resolve conflicts by cross-checking with current state
 * @param {Object} timetableWithConflicts - Timetable containing stored conflicts
 * @param {Array} savedTimetables - Current saved timetables
 * @param {Array} unsavedTimetables - Current unsaved timetables
 * @returns {Object} Updated timetable with resolved conflicts removed
 */
export const resolveConflicts = (timetableWithConflicts, savedTimetables = [], unsavedTimetables = []) => {
  const updatedTimetable = JSON.parse(JSON.stringify(timetableWithConflicts)); // Deep clone
  
  WEEKDAYS.forEach(day => {
    if (!updatedTimetable[day]) return;
    
    TIME_SLOTS.forEach(timeSlot => {
      const slot = updatedTimetable[day][timeSlot];
      if (!slot || !slot.conflicts) return;
      
      // Get current conflicts for this slot
      const currentConflicts = checkSlotConflicts(
        day, 
        timeSlot, 
        slot, 
        [...savedTimetables, ...unsavedTimetables],
        updatedTimetable.id
      );
      
      // Filter out resolved conflicts
      const unresolvedConflicts = slot.conflicts.filter(storedConflict => {
        return currentConflicts.some(currentConflict => 
          currentConflict.type === storedConflict.type &&
          currentConflict.program === storedConflict.program &&
          currentConflict.branch === storedConflict.branch &&
          currentConflict.semester === storedConflict.semester &&
          currentConflict.batch === storedConflict.batch &&
          currentConflict.programType === storedConflict.programType
        );
      });
      
      // Update conflicts - remove if empty, otherwise update
      if (unresolvedConflicts.length === 0) {
        delete updatedTimetable[day][timeSlot].conflicts;
      } else {
        updatedTimetable[day][timeSlot].conflicts = unresolvedConflicts;
      }
    });
  });
  
  return updatedTimetable;
};

/**
 * Add conflicts to a timetable
 * @param {Object} timetable - The timetable to add conflicts to
 * @param {Object} conflictsMap - Conflicts organized by day and time slot
 * @returns {Object} Updated timetable with conflicts added
 */
export const addConflictsToTimetable = (timetable, conflictsMap) => {
  const updatedTimetable = JSON.parse(JSON.stringify(timetable)); // Deep clone
  
  WEEKDAYS.forEach(day => {
    if (!updatedTimetable[day] || !conflictsMap[day]) return;
    
    TIME_SLOTS.forEach(timeSlot => {
      const conflicts = conflictsMap[day][timeSlot];
      if (conflicts && conflicts.length > 0) {
        if (!updatedTimetable[day][timeSlot]) {
          updatedTimetable[day][timeSlot] = { course: '', teacher: '', room: '' };
        }
        updatedTimetable[day][timeSlot].conflicts = conflicts;
      }
    });
  });
  
  return updatedTimetable;
};

/**
 * Get all conflicts from a timetable
 * @param {Object} timetable - The timetable to extract conflicts from
 * @returns {Array} Array of all conflicts with their locations
 */
export const getAllConflictsFromTimetable = (timetable) => {
  const allConflicts = [];
  
  WEEKDAYS.forEach(day => {
    if (!timetable[day]) return;
    
    TIME_SLOTS.forEach(timeSlot => {
      const slot = timetable[day][timeSlot];
      if (slot && slot.conflicts) {
        slot.conflicts.forEach(conflict => {
          allConflicts.push({
            ...conflict,
            day,
            timeSlot,
            location: `${day} ${timeSlot}`
          });
        });
      }
    });
  });
  
  return allConflicts;
};

/**
 * Check if a timetable has any conflicts
 * @param {Object} timetable - The timetable to check
 * @returns {boolean} True if timetable has conflicts
 */
export const hasConflicts = (timetable) => {
  return getAllConflictsFromTimetable(timetable).length > 0;
};

/**
 * Get conflict statistics for a timetable
 * @param {Object} timetable - The timetable to analyze
 * @returns {Object} Conflict statistics
 */
export const getConflictStatistics = (timetable) => {
  const allConflicts = getAllConflictsFromTimetable(timetable);
  
  const teacherConflicts = allConflicts.filter(c => c.type === 'teacher');
  const roomConflicts = allConflicts.filter(c => c.type === 'room');
  const ignorableConflicts = allConflicts.filter(c => c.ignorable);
  const criticalConflicts = allConflicts.filter(c => !c.ignorable);
  
  return {
    total: allConflicts.length,
    teacher: teacherConflicts.length,
    room: roomConflicts.length,
    ignorable: ignorableConflicts.length,
    critical: criticalConflicts.length,
    hasConflicts: allConflicts.length > 0
  };
};

/**
 * Real-time conflict checker for use during timetable editing
 * @param {string} day - Day of the week
 * @param {string} timeSlot - Time slot
 * @param {Object} newSlotData - New slot data being entered
 * @param {Array} allTimetables - All timetables to check against
 * @param {string} excludeTimetableId - Current timetable ID to exclude
 * @returns {Object} Immediate conflict check result
 */
export const checkImmediateConflicts = (day, timeSlot, newSlotData, allTimetables, excludeTimetableId) => {
  const conflicts = checkSlotConflicts(day, timeSlot, newSlotData, allTimetables, excludeTimetableId);
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    canProceed: conflicts.length === 0 || conflicts.every(c => c.ignorable)
  };
};

/**
 * Performance optimization: Create an index for faster conflict checking
 * @param {Array} timetables - Array of timetables to index
 * @returns {Object} Indexed structure for faster lookups
 */
export const createConflictIndex = (timetables) => {
  const teacherIndex = {}; // teacher -> [{ timetableId, day, timeSlot, timetable }]
  const roomIndex = {};    // room -> [{ timetableId, day, timeSlot, timetable }]
  
  timetables.forEach(timetable => {
    WEEKDAYS.forEach(day => {
      if (!timetable[day]) return;
      
      TIME_SLOTS.forEach(timeSlot => {
        const slot = timetable[day][timeSlot];
        if (!slot) return;
        
        // Index by teacher
        if (slot.teacher && slot.teacher.trim()) {
          const teacher = slot.teacher.trim();
          if (!teacherIndex[teacher]) teacherIndex[teacher] = [];
          teacherIndex[teacher].push({
            timetableId: timetable.id,
            day,
            timeSlot,
            timetable
          });
        }
        
        // Index by room
        if (slot.room && slot.room.trim()) {
          const room = slot.room.trim();
          if (!roomIndex[room]) roomIndex[room] = [];
          roomIndex[room].push({
            timetableId: timetable.id,
            day,
            timeSlot,
            timetable
          });
        }
      });
    });
  });
  
  return { teacherIndex, roomIndex };
};

/**
 * Fast conflict checking using pre-built index
 * @param {string} day - Day of the week
 * @param {string} timeSlot - Time slot
 * @param {Object} slotData - Slot data to check
 * @param {Object} conflictIndex - Pre-built conflict index
 * @param {string} excludeTimetableId - Timetable ID to exclude
 * @returns {Array} Array of conflicts found
 */
export const checkSlotConflictsWithIndex = (day, timeSlot, slotData, conflictIndex, excludeTimetableId = null) => {
  const conflicts = [];
  const { teacherIndex, roomIndex } = conflictIndex;
  
  // Check teacher conflicts
  if (slotData.teacher && slotData.teacher.trim()) {
    const teacher = slotData.teacher.trim();
    const teacherSlots = teacherIndex[teacher] || [];
    
    teacherSlots.forEach(slot => {
      if (slot.day === day && slot.timeSlot === timeSlot && slot.timetableId !== excludeTimetableId) {
        conflicts.push(createConflict('teacher', slot.timetable, false));
      }
    });
  }
  
  // Check room conflicts
  if (slotData.room && slotData.room.trim()) {
    const room = slotData.room.trim();
    const roomSlots = roomIndex[room] || [];
    
    roomSlots.forEach(slot => {
      if (slot.day === day && slot.timeSlot === timeSlot && slot.timetableId !== excludeTimetableId) {
        conflicts.push(createConflict('room', slot.timetable, false));
      }
    });
  }
  
  return conflicts;
};

/**
 * Batch process conflicts for multiple timetables
 * @param {Array} unsavedTimetables - Array of unsaved timetables
 * @param {Array} savedTimetables - Array of saved timetables
 * @returns {Object} Conflicts for all timetables
 */
export const batchProcessConflicts = (unsavedTimetables, savedTimetables) => {
  const allConflicts = {};
  
  // Create conflict index for performance
  const conflictIndex = createConflictIndex([...savedTimetables, ...unsavedTimetables]);
  
  unsavedTimetables.forEach(timetable => {
    allConflicts[timetable.id] = checkTimetableConflicts(timetable, savedTimetables, unsavedTimetables);
  });
  
  return allConflicts;
};

/**
 * Get conflict summary across all timetables
 * @param {Array} timetables - Array of all timetables
 * @returns {Object} Overall conflict summary
 */
export const getOverallConflictSummary = (timetables) => {
  let totalConflicts = 0;
  let teacherConflicts = 0;
  let roomConflicts = 0;
  let timetablesWithConflicts = 0;
  
  timetables.forEach(timetable => {
    const stats = getConflictStatistics(timetable);
    if (stats.hasConflicts) {
      timetablesWithConflicts++;
      totalConflicts += stats.total;
      teacherConflicts += stats.teacher;
      roomConflicts += stats.room;
    }
  });
  
  return {
    totalConflicts,
    teacherConflicts,
    roomConflicts,
    timetablesWithConflicts,
    totalTimetables: timetables.length,
    conflictRate: timetables.length > 0 ? (timetablesWithConflicts / timetables.length * 100).toFixed(1) : 0
  };
};

/**
 * Find all timetables that conflict with a specific teacher/room at a specific time
 * @param {string} resourceType - 'teacher' or 'room'
 * @param {string} resourceName - Name of teacher or room
 * @param {string} day - Day of the week
 * @param {string} timeSlot - Time slot
 * @param {Array} timetables - Array of all timetables
 * @returns {Array} Array of conflicting timetables
 */
export const findConflictingTimetables = (resourceType, resourceName, day, timeSlot, timetables) => {
  const conflictingTimetables = [];
  
  timetables.forEach(timetable => {
    if (!timetable[day] || !timetable[day][timeSlot]) return;
    
    const slot = timetable[day][timeSlot];
    const resourceValue = resourceType === 'teacher' ? slot.teacher : slot.room;
    
    if (resourceValue && resourceValue.trim() === resourceName.trim()) {
      conflictingTimetables.push({
        timetable,
        identifier: getTimetableIdentifier(timetable),
        slot: slot
      });
    }
  });
  
  return conflictingTimetables;
};

/**
 * Suggest alternative time slots for resolving conflicts
 * @param {Object} timetable - The timetable with conflicts
 * @param {string} day - Day of the conflict
 * @param {string} timeSlot - Time slot of the conflict
 * @param {Array} allTimetables - All timetables to check against
 * @returns {Array} Array of suggested alternative slots
 */
export const suggestAlternativeSlots = (timetable, day, timeSlot, allTimetables) => {
  const currentSlot = timetable[day][timeSlot];
  if (!currentSlot) return [];
  
  const suggestions = [];
  
  // Check other time slots on the same day
  TIME_SLOTS.forEach(altTimeSlot => {
    if (altTimeSlot === timeSlot) return;
    
    const conflicts = checkSlotConflicts(day, altTimeSlot, currentSlot, allTimetables, timetable.id);
    if (conflicts.length === 0) {
      suggestions.push({
        day,
        timeSlot: altTimeSlot,
        conflicts: [],
        suggestion: `Move to ${day} ${altTimeSlot}`
      });
    }
  });
  
  // Check same time slot on other days
  WEEKDAYS.forEach(altDay => {
    if (altDay === day) return;
    
    const conflicts = checkSlotConflicts(altDay, timeSlot, currentSlot, allTimetables, timetable.id);
    if (conflicts.length === 0) {
      suggestions.push({
        day: altDay,
        timeSlot,
        conflicts: [],
        suggestion: `Move to ${altDay} ${timeSlot}`
      });
    }
  });
  
  return suggestions.slice(0, 5); // Return top 5 suggestions
};

/**
 * Mark a conflict as ignorable
 * @param {Object} timetable - The timetable containing the conflict
 * @param {string} day - Day of the conflict
 * @param {string} timeSlot - Time slot of the conflict
 * @param {number} conflictIndex - Index of the conflict in the conflicts array
 * @returns {Object} Updated timetable
 */
export const markConflictAsIgnorable = (timetable, day, timeSlot, conflictIndex) => {
  const updatedTimetable = JSON.parse(JSON.stringify(timetable));
  
  if (updatedTimetable[day] && 
      updatedTimetable[day][timeSlot] && 
      updatedTimetable[day][timeSlot].conflicts &&
      updatedTimetable[day][timeSlot].conflicts[conflictIndex]) {
    updatedTimetable[day][timeSlot].conflicts[conflictIndex].ignorable = true;
  }
  
  return updatedTimetable;
};

/**
 * Remove all ignorable conflicts from a timetable
 * @param {Object} timetable - The timetable to clean
 * @returns {Object} Updated timetable with ignorable conflicts removed
 */
export const removeIgnorableConflicts = (timetable) => {
  const updatedTimetable = JSON.parse(JSON.stringify(timetable));
  
  WEEKDAYS.forEach(day => {
    if (!updatedTimetable[day]) return;
    
    TIME_SLOTS.forEach(timeSlot => {
      const slot = updatedTimetable[day][timeSlot];
      if (!slot || !slot.conflicts) return;
      
      const criticalConflicts = slot.conflicts.filter(conflict => !conflict.ignorable);
      
      if (criticalConflicts.length === 0) {
        delete updatedTimetable[day][timeSlot].conflicts;
      } else {
        updatedTimetable[day][timeSlot].conflicts = criticalConflicts;
      }
    });
  });
  
  return updatedTimetable;
};
