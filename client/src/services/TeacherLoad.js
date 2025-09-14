import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Teacher data structure for validation
const TEACHER_FIELDS = {
  required: ['name', 'code', 'department', 'faculty'],
  optional: ['qualification', 'years', 'designation', 'email', 'phone', 'specialization']
};

// CSV Template structure
export const CSV_TEMPLATE = {
  headers: ['name', 'code', 'department', 'faculty', 'qualification', 'years', 'designation', 'email', 'phone', 'specialization']
};

// Collection reference
const COLLECTION_NAME = 'teachers';

/**
 * Validates teacher data
 * @param {Object} teacherData - Teacher data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateTeacherData = (teacherData) => {
  const errors = [];
  
  // Check required fields
  TEACHER_FIELDS.required.forEach(field => {
    if (!teacherData[field] || teacherData[field].toString().trim() === '') {
      errors.push(`${field} is required`);
    }
  });

  // Validate email format if provided
  if (teacherData.email && teacherData.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(teacherData.email)) {
      errors.push('Invalid email format');
    }
  }

  // Validate teacher code uniqueness will be checked in add/update functions
  if (teacherData.code && teacherData.code.length < 2) {
    errors.push('Teacher code must be at least 2 characters long');
  }

  // Validate years if provided
  if (teacherData.years && teacherData.years.trim() !== '') {
    const yearsNum = parseInt(teacherData.years);
    if (isNaN(yearsNum) || yearsNum < 0 || yearsNum > 50) {
      errors.push('Years of experience must be a number between 0 and 50');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if teacher code already exists
 * @param {string} code - Teacher code to check
 * @param {string} excludeId - Document ID to exclude from check (for updates)
 * @returns {Promise<boolean>} - Returns true if code exists
 */
export const checkTeacherCodeExists = async (code, excludeId = null) => {
  try {
    const teachersRef = collection(db, COLLECTION_NAME);
    const q = query(teachersRef, where('code', '==', code));
    const querySnapshot = await getDocs(q);
    
    if (excludeId) {
      // For updates, check if any other document has the same code
      return querySnapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking teacher code:', error);
    throw new Error('Failed to validate teacher code uniqueness');
  }
};

/**
 * Add a new teacher to Firestore
 * @param {Object} teacherData - Teacher data
 * @returns {Promise<Object>} - { success: boolean, data?: Object, error?: string }
 */
export const addTeacher = async (teacherData) => {
  try {
    // Validate data
    const validation = validateTeacherData(teacherData);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      };
    }

    // Check if teacher code already exists
    const codeExists = await checkTeacherCodeExists(teacherData.code);
    if (codeExists) {
      return {
        success: false,
        error: `Teacher code '${teacherData.code}' already exists`
      };
    }

    // Add timestamp
    const teacherWithTimestamp = {
      ...teacherData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const teachersRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(teachersRef, teacherWithTimestamp);

    return {
      success: true,
      data: {
        id: docRef.id,
        ...teacherWithTimestamp
      }
    };
  } catch (error) {
    console.error('Error adding teacher:', error);
    return {
      success: false,
      error: 'Failed to add teacher to database'
    };
  }
};

/**
 * Update an existing teacher
 * @param {string} teacherId - Document ID
 * @param {Object} teacherData - Updated teacher data
 * @returns {Promise<Object>} - { success: boolean, data?: Object, error?: string }
 */
export const updateTeacher = async (teacherId, teacherData) => {
  try {
    // Validate data
    const validation = validateTeacherData(teacherData);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      };
    }

    // Check if teacher code already exists (excluding current document)
    const codeExists = await checkTeacherCodeExists(teacherData.code, teacherId);
    if (codeExists) {
      return {
        success: false,
        error: `Teacher code '${teacherData.code}' already exists`
      };
    }

    const teacherRef = doc(db, COLLECTION_NAME, teacherId);
    const updatedData = {
      ...teacherData,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(teacherRef, updatedData);

    return {
      success: true,
      data: {
        id: teacherId,
        ...updatedData
      }
    };
  } catch (error) {
    console.error('Error updating teacher:', error);
    return {
      success: false,
      error: 'Failed to update teacher in database'
    };
  }
};

/**
 * Delete a teacher
 * @param {string} teacherId - Document ID
 * @returns {Promise<Object>} - { success: boolean, error?: string }
 */
export const deleteTeacher = async (teacherId) => {
  try {
    const teacherRef = doc(db, COLLECTION_NAME, teacherId);
    await deleteDoc(teacherRef);

    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return {
      success: false,
      error: 'Failed to delete teacher from database'
    };
  }
};

/**
 * Fetch all teachers
 * @returns {Promise<Object>} - { success: boolean, data?: Array, error?: string }
 */
export const getAllTeachers = async () => {
  try {
    const teachersRef = collection(db, COLLECTION_NAME);
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
      error: 'Failed to fetch teachers from database'
    };
  }
};

/**
 * Fetch teachers by department
 * @param {string} department - Department name
 * @returns {Promise<Object>} - { success: boolean, data?: Array, error?: string }
 */
export const getTeachersByDepartment = async (department) => {
  try {
    const teachersRef = collection(db, COLLECTION_NAME);
    const q = query(
      teachersRef, 
      where('department', '==', department)
    );
    const querySnapshot = await getDocs(q);

    const teachers = [];
    querySnapshot.forEach((doc) => {
      teachers.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by name in JavaScript instead of Firestore
    teachers.sort((a, b) => a.name.localeCompare(b.name));

    return {
      success: true,
      data: teachers
    };
  } catch (error) {
    console.error('Error fetching teachers by department:', error);
    return {
      success: false,
      error: 'Failed to fetch teachers by department'
    };
  }
};

/**
 * Fetch teachers by faculty
 * @param {string} faculty - Faculty name
 * @returns {Promise<Object>} - { success: boolean, data?: Array, error?: string }
 */
export const getTeachersByFaculty = async (faculty) => {
  try {
    const teachersRef = collection(db, COLLECTION_NAME);
    const q = query(
      teachersRef, 
      where('faculty', '==', faculty),
      orderBy('name')
    );
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
    console.error('Error fetching teachers by faculty:', error);
    return {
      success: false,
      error: 'Failed to fetch teachers by faculty'
    };
  }
};

/**
 * Parse CSV data and validate format
 * @param {string} csvText - CSV content as text
 * @returns {Object} - { isValid: boolean, data?: Array, errors?: Array }
 */
export const parseAndValidateCSV = (csvText) => {
  try {
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      return {
        isValid: false,
        errors: ['CSV file must contain at least a header row and one data row']
      };
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Check required headers
    const missingHeaders = TEACHER_FIELDS.required.filter(
      field => !headers.includes(field.toLowerCase())
    );
    
    if (missingHeaders.length > 0) {
      return {
        isValid: false,
        errors: [`Missing required columns: ${missingHeaders.join(', ')}`]
      };
    }

    // Parse data rows
    const teachers = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim());
      
      if (row.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      const teacher = {};
      headers.forEach((header, index) => {
        teacher[header] = row[index];
      });

      // Validate each teacher
      const validation = validateTeacherData(teacher);
      if (!validation.isValid) {
        errors.push(`Row ${i + 1}: ${validation.errors.join(', ')}`);
      } else {
        teachers.push(teacher);
      }
    }

    return {
      isValid: errors.length === 0,
      data: teachers,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Failed to parse CSV file. Please check the format.']
    };
  }
};

/**
 * Batch upload teachers from CSV
 * @param {Array} teachersData - Array of teacher objects
 * @returns {Promise<Object>} - { success: boolean, data?: Object, error?: string }
 */
export const batchUploadTeachers = async (teachersData) => {
  try {
    const batch = writeBatch(db);
    const teachersRef = collection(db, COLLECTION_NAME);
    
    // Check for duplicate codes within the batch and existing data
    const codes = teachersData.map(t => t.code);
    const duplicateCodesInBatch = codes.filter((code, index) => codes.indexOf(code) !== index);
    
    if (duplicateCodesInBatch.length > 0) {
      return {
        success: false,
        error: `Duplicate teacher codes in CSV: ${[...new Set(duplicateCodesInBatch)].join(', ')}`
      };
    }

    // Check for existing codes in database
    const existingCodes = [];
    for (const teacher of teachersData) {
      const exists = await checkTeacherCodeExists(teacher.code);
      if (exists) {
        existingCodes.push(teacher.code);
      }
    }

    if (existingCodes.length > 0) {
      return {
        success: false,
        error: `Teacher codes already exist in database: ${existingCodes.join(', ')}`
      };
    }

    // Add all teachers to batch
    const timestamp = new Date().toISOString();
    teachersData.forEach((teacher) => {
      const docRef = doc(teachersRef);
      const teacherWithTimestamp = {
        ...teacher,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      batch.set(docRef, teacherWithTimestamp);
    });

    await batch.commit();

    return {
      success: true,
      data: {
        uploadedCount: teachersData.length,
        message: `Successfully uploaded ${teachersData.length} teachers`
      }
    };
  } catch (error) {
    console.error('Error in batch upload:', error);
    return {
      success: false,
      error: 'Failed to upload teachers to database'
    };
  }
};

/**
 * Generate CSV template for download
 * @returns {string} - CSV content as string
 */
export const generateCSVTemplate = () => {
  const headers = CSV_TEMPLATE.headers.join(',');
  
  return headers;
};

/**
 * Export teachers data to CSV
 * @param {Array} teachers - Array of teacher objects
 * @returns {string} - CSV content as string
 */
export const exportTeachersToCSV = (teachers) => {
  if (!teachers || teachers.length === 0) {
    return '';
  }

  const headers = CSV_TEMPLATE.headers.join(',');
  const rows = teachers.map(teacher => {
    return CSV_TEMPLATE.headers.map(header => {
      return teacher[header] || '';
    }).join(',');
  }).join('\n');

  return `${headers}\n${rows}`;
};

/**
 * Get unique departments from all teachers
 * @returns {Promise<Object>} - { success: boolean, data?: Array, error?: string }
 */
export const getUniqueDepartments = async () => {
  try {
    const result = await getAllTeachers();
    if (!result.success) {
      return result;
    }

    const departments = [...new Set(result.data.map(teacher => teacher.department))];
    
    return {
      success: true,
      data: departments.sort()
    };
  } catch (error) {
    console.error('Error getting unique departments:', error);
    return {
      success: false,
      error: 'Failed to fetch departments'
    };
  }
};

/**
 * Get unique faculties from all teachers
 * @returns {Promise<Object>} - { success: boolean, data?: Array, error?: string }
 */
export const getUniqueFaculties = async () => {
  try {
    const result = await getAllTeachers();
    if (!result.success) {
      return result;
    }

    const faculties = [...new Set(result.data.map(teacher => teacher.faculty))];
    
    return {
      success: true,
      data: faculties.sort()
    };
  } catch (error) {
    console.error('Error getting unique faculties:', error);
    return {
      success: false,
      error: 'Failed to fetch faculties'
    };
  }
};

/**
 * Get teacher statistics
 * @returns {Promise<Object>} - { success: boolean, data?: Object, error?: string }
 */
export const getTeacherStatistics = async () => {
  try {
    const result = await getAllTeachers();
    if (!result.success) {
      return result;
    }

    const teachers = result.data;
    const departments = [...new Set(teachers.map(t => t.department))];
    const faculties = [...new Set(teachers.map(t => t.faculty))];
    const professors = teachers.filter(t => t.designation && t.designation.toLowerCase().includes('professor'));

    return {
      success: true,
      data: {
        totalTeachers: teachers.length,
        totalDepartments: departments.length,
        totalFaculties: faculties.length,
        totalProfessors: professors.length,
        departmentBreakdown: departments.map(dept => ({
          department: dept,
          count: teachers.filter(t => t.department === dept).length
        })),
        facultyBreakdown: faculties.map(faculty => ({
          faculty: faculty,
          count: teachers.filter(t => t.faculty === faculty).length
        }))
      }
    };
  } catch (error) {
    console.error('Error getting teacher statistics:', error);
    return {
      success: false,
      error: 'Failed to fetch teacher statistics'
    };
  }
};
