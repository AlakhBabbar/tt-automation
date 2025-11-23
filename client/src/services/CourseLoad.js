import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const COLLECTION_NAME = 'courses';

// Get all courses
export const getAllCourses = async () => {
  try {
    const coursesRef = collection(db, COLLECTION_NAME);
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

// Add a new course
export const addCourse = async (courseData) => {
  try {
    // Validate required fields (all except description and teachers)
    if (!courseData.name || !courseData.code || !courseData.credits || 
        !courseData.department || !courseData.faculty || !courseData.semester || !courseData.type) {
      return {
        success: false,
        error: 'Missing required fields: name, code, credits, department, faculty, semester, and type are required'
      };
    }

    // Check if course code already exists
    const existingCourses = await getAllCourses();
    if (existingCourses.success) {
      const codeExists = existingCourses.data.some(
        course => course.code.toLowerCase() === courseData.code.toLowerCase()
      );
      
      if (codeExists) {
        return {
          success: false,
          error: 'Course code already exists'
        };
      }
    }

    const coursesRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(coursesRef, {
      ...courseData,
      credits: parseInt(courseData.credits) || 0,
      semester: courseData.semester || '',
      teachers: courseData.teachers || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      data: { id: docRef.id, ...courseData }
    };
  } catch (error) {
    console.error('Error adding course:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update an existing course
export const updateCourse = async (courseId, courseData) => {
  try {
    if (!courseId) {
      return {
        success: false,
        error: 'Course ID is required'
      };
    }

    // Validate required fields (all except description and teachers)
    if (!courseData.name || !courseData.code || !courseData.credits || 
        !courseData.department || !courseData.faculty || !courseData.semester || !courseData.type) {
      return {
        success: false,
        error: 'Missing required fields: name, code, credits, department, faculty, semester, and type are required'
      };
    }

    // Check if course code already exists (excluding current course)
    const existingCourses = await getAllCourses();
    if (existingCourses.success) {
      const codeExists = existingCourses.data.some(
        course => course.code.toLowerCase() === courseData.code.toLowerCase() && course.id !== courseId
      );
      
      if (codeExists) {
        return {
          success: false,
          error: 'Course code already exists'
        };
      }
    }

    const courseRef = doc(db, COLLECTION_NAME, courseId);
    await updateDoc(courseRef, {
      ...courseData,
      credits: parseInt(courseData.credits) || 0,
      semester: courseData.semester || '',
      teachers: courseData.teachers || '',
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      data: { id: courseId, ...courseData }
    };
  } catch (error) {
    console.error('Error updating course:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete a course
export const deleteCourse = async (courseId) => {
  try {
    if (!courseId) {
      return {
        success: false,
        error: 'Course ID is required'
      };
    }

    const courseRef = doc(db, COLLECTION_NAME, courseId);
    await deleteDoc(courseRef);
    
    return {
      success: true,
      data: { id: courseId }
    };
  } catch (error) {
    console.error('Error deleting course:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get course statistics
export const getCourseStatistics = async () => {
  try {
    const result = await getAllCourses();
    if (!result.success) {
      return result;
    }

    const courses = result.data;
    const departments = [...new Set(courses.map(course => course.department).filter(Boolean))];
    const totalCredits = courses.reduce((sum, course) => sum + (parseInt(course.credits) || 0), 0);

    const stats = {
      totalCourses: courses.length,
      departments: departments.length,
      totalCredits: totalCredits,
      theoryCourses: courses.filter(course => course.type === 'Theory').length,
      practicalCourses: courses.filter(course => course.type === 'Practical').length,
      averageCredits: courses.length > 0 ? (totalCredits / courses.length).toFixed(1) : 0
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting course statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Parse and validate CSV data
export const parseAndValidateCSV = (csvText) => {
  try {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return {
        success: false,
        error: 'CSV file must contain at least a header row and one data row'
      };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'code', 'credits', 'department', 'faculty', 'semester', 'type'];
    const optionalHeaders = ['description'];
    
    // Check for required headers
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return {
        success: false,
        error: `Missing required columns: ${missingHeaders.join(', ')}`
      };
    }

    const courses = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const course = {};

      headers.forEach((header, index) => {
        if (requiredHeaders.includes(header) || optionalHeaders.includes(header)) {
          course[header] = values[index] || '';
        }
      });

      // Validate required fields
      const missingFields = requiredHeaders.filter(field => !course[field]);
      if (missingFields.length > 0) {
        errors.push(`Row ${i + 1}: Missing required fields: ${missingFields.join(', ')}`);
        continue;
      }

      // Validate credits is a number
      console.log(`Row ${i + 1}: Validating credits for course:`, course);
      console.log(`Row ${i + 1}: Credits value:`, course.credits);
      console.log(`Row ${i + 1}: Credits value type:`, typeof course.credits);
      console.log(`Row ${i + 1}: Credits after trim:`, course.credits?.trim());
      
      const creditsValue = course.credits?.toString().trim() || '';
      const credits = parseInt(creditsValue);
      
      console.log(`Row ${i + 1}: Parsed credits:`, credits);
      console.log(`Row ${i + 1}: isNaN(credits):`, isNaN(credits));
      
      if (isNaN(credits) || credits < 1 || credits > 10) {
        errors.push(`Row ${i + 1}: Credits must be a number between 1 and 10. Found: '${course.credits}' (type: ${typeof course.credits})`);
        continue;
      }

      // Validate type
      if (!['Theory', 'Practical'].includes(course.type)) {
        errors.push(`Row ${i + 1}: Type must be either 'Theory' or 'Practical'`);
        continue;
      }

      // Set teachers to empty string as per requirement
      course.teachers = '';
      
      courses.push(course);
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join('\n')
      };
    }

    return {
      success: true,
      data: courses
    };
  } catch (error) {
    return {
      success: false,
      error: 'Error parsing CSV file: ' + error.message
    };
  }
};

// Batch upload courses
export const batchUploadCourses = async (coursesData) => {
  try {
    let successCount = 0;
    const errors = [];

    for (const courseData of coursesData) {
      const result = await addCourse(courseData);
      if (result.success) {
        successCount++;
      } else {
        errors.push(`Error adding course ${courseData.name}: ${result.error}`);
      }
    }

    if (errors.length > 0 && successCount === 0) {
      return {
        success: false,
        error: errors.join('\n')
      };
    }

    return {
      success: true,
      count: successCount,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    return {
      success: false,
      error: 'Batch upload failed: ' + error.message
    };
  }
};

// Generate CSV template
export const generateCSVTemplate = () => {
  const headers = ['name', 'code', 'credits', 'department', 'faculty', 'semester', 'type', 'description'];
  const sampleData = [
    'Introduction to Programming,CS101,3,Computer Science,Engineering,1,Theory,Basic programming concepts and logic',
    'Programming Lab,CS101L,1,Computer Science,Engineering,1,Practical,Hands-on programming practice'
  ];

  return [headers.join(','), ...sampleData].join('\n');
};

// Export courses to CSV
export const exportCoursesToCSV = async (courses) => {
  try {
    const headers = ['Name', 'Code', 'Credits', 'Department', 'Faculty', 'Semester', 'Teachers', 'Description', 'Type'];
    const csvRows = [headers.join(',')];

    courses.forEach(course => {
      const row = [
        course.name || '',
        course.code || '',
        course.credits || '',
        course.department || '',
        course.faculty || '',
        course.semester || '',
        course.teachers || '',
        course.description ? `"${course.description.replace(/"/g, '""')}"` : '',
        course.type || ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  } catch (error) {
    throw new Error('Failed to export courses to CSV: ' + error.message);
  }
};