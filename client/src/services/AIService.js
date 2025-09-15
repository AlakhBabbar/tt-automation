import { API_BASE_URL } from '../firebase/firebaseConfig';

/**
 * AI Service for timetable generation
 * Handles communication with backend AI endpoints
 */

/**
 * Generate timetable using AI
 * @param {Object} requestData - The complete request data for AI generation
 * @param {Array} requestData.classRequests - Array of class requirements
 * @param {Array} requestData.existingTimetables - Selected existing timetables (if any)
 * @param {Array} requestData.courses - All available courses
 * @param {Array} requestData.teachers - All available teachers  
 * @param {Array} requestData.rooms - All available rooms
 * @param {Object} requestData.settings - Additional settings for generation
 * @returns {Promise<Object>} Response from AI service
 */
export const generateTimetableWithAI = async (requestData) => {
  try {
    console.log('🤖 Sending AI generation request to:', `${API_BASE_URL}/generate-timetable-ai`);
    console.log('🤖 Request data:', requestData);
    
    const response = await fetch(`${API_BASE_URL}/generate-timetable-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('🤖 AI generation response:', result);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('❌ Error in AI generation:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Cannot connect to backend server. Please ensure Firebase Functions emulator is running.';
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Connection refused. Backend server is not running.';
    } else if (error.message.includes('404')) {
      errorMessage = 'Backend endpoint not found. Check if the correct function is deployed.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Prepare complete data package for AI generation
 * @param {Array} classRequests - User's class requirements
 * @param {Array} selectedTimetableIds - IDs of selected existing timetables
 * @param {Array} allTimetables - All available timetables
 * @param {Array} courses - All courses data
 * @param {Array} teachers - All teachers data
 * @param {Array} rooms - All rooms data
 * @returns {Object} Complete data package for AI
 */
export const prepareAIRequestData = (
  classRequests, 
  selectedTimetableIds, 
  allTimetables, 
  courses, 
  teachers, 
  rooms
) => {
  // Filter selected existing timetables
  const selectedTimetables = allTimetables.filter(tt => 
    selectedTimetableIds.includes(tt.id)
  );

  const requestData = {
    classRequests: classRequests.map(request => ({
      program: request.program.trim(),
      branch: request.branch.trim(),
      semester: request.semester.trim(),
      batch: request.batch.trim(),
      type: request.type.trim(),
      credits: request.credits.trim()
    })),
    existingTimetables: selectedTimetables,
    courses: courses || [],
    teachers: teachers || [],
    rooms: rooms || [],
    settings: {
      avoidConflicts: selectedTimetables.length > 0,
      includeExistingConstraints: true,
      optimizeForEfficiency: true,
      generatedAt: new Date().toISOString(),
      requestId: `ai_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  };

  console.log('📦 Prepared AI request data:', {
    classRequestsCount: requestData.classRequests.length,
    existingTimetablesCount: requestData.existingTimetables.length,
    coursesCount: requestData.courses.length,
    teachersCount: requestData.teachers.length,
    roomsCount: requestData.rooms.length,
    settings: requestData.settings
  });

  return requestData;
};

/**
 * Validate class requests before sending to AI
 * @param {Array} classRequests - Array of class requirements
 * @returns {Object} Validation result
 */
export const validateClassRequests = (classRequests) => {
  const errors = [];
  
  if (!classRequests || classRequests.length === 0) {
    errors.push('At least one class definition is required');
    return { isValid: false, errors };
  }

  classRequests.forEach((request, index) => {
    const missingFields = [];
    
    if (!request.program?.trim()) missingFields.push('Program');
    if (!request.branch?.trim()) missingFields.push('Branch');
    if (!request.semester?.trim()) missingFields.push('Semester');
    if (!request.batch?.trim()) missingFields.push('Batch');
    if (!request.type?.trim()) missingFields.push('Type');
    if (!request.credits?.trim()) missingFields.push('Credits');
    
    if (missingFields.length > 0) {
      errors.push(`Row ${index + 1}: Missing ${missingFields.join(', ')}`);
    }
    
    // Validate credits is a number
    if (request.credits?.trim()) {
      const credits = parseInt(request.credits.trim());
      if (isNaN(credits) || credits <= 0) {
        errors.push(`Row ${index + 1}: Credits must be a positive number`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};