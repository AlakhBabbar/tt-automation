import React, { useState, useEffect } from 'react';
import Menu from '../Components/Menu';
import { 
  FaBook, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaDownload, 
  FaUpload, 
  FaFileExport, 
  FaSearch,
  FaTimes,
  FaSave,
  FaBuilding,
  FaGraduationCap,
  FaCheckCircle,
  FaSpinner,
  FaExclamationTriangle,
  FaCodeBranch,
  FaUsers
} from 'react-icons/fa';
import { 
  FiFilter, 
  FiFileText, 
  FiBook as FiBookIcon, 
  FiAward,
  FiBriefcase,
  FiHash,
  FiUser
} from 'react-icons/fi';
import {
  getAllCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  parseAndValidateCSV,
  batchUploadCourses,
  generateCSVTemplate,
  exportCoursesToCSV,
  getCourseStatistics
} from '../services/CourseLoad';

const CourseLoad = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: '',
    department: '',
    faculty: '',
    semester: '',
    teachers: '',
    description: '',
    type: ''
  });

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
    loadStatistics();
  }, []);

  // Load all courses from Firebase
  const loadCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllCourses();
      if (result.success) {
        setCourses(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const result = await getCourseStatistics();
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation - all fields required except description and teachers
    if (!formData.name || !formData.code || !formData.credits || !formData.department || 
        !formData.faculty || !formData.semester || !formData.type) {
      setError('Please fill in all required fields (all fields except Description and Teachers are required)');
      return;
    }

    try {
      if (editingCourse) {
        // Update existing course
        const result = await updateCourse(editingCourse.id, formData);
        if (result.success) {
          setSuccess('Course updated successfully!');
          await loadCourses();
          await loadStatistics();
        } else {
          setError(result.error);
        }
      } else {
        // Add new course
        const result = await addCourse(formData);
        if (result.success) {
          setSuccess('Course added successfully!');
          await loadCourses();
          await loadStatistics();
        } else {
          setError(result.error);
        }
      }
      
      if (!error) {
        resetForm();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const handleEdit = (course) => {
    setFormData(course);
    setEditingCourse(course);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      setError('');
      setSuccess('');
      
      try {
        const result = await deleteCourse(id);
        if (result.success) {
          setSuccess('Course deleted successfully!');
          await loadCourses();
          await loadStatistics();
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to delete course');
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');

    try {
      const text = await file.text();
      const parseResult = parseAndValidateCSV(text);
      
      if (!parseResult.success) {
        setError(`CSV validation failed: ${parseResult.error}`);
        return;
      }

      const uploadResult = await batchUploadCourses(parseResult.data);
      if (uploadResult.success) {
        setSuccess(`Successfully uploaded ${uploadResult.count} courses!`);
        await loadCourses();
        await loadStatistics();
      } else {
        setError(uploadResult.error);
      }
    } catch (err) {
      setError('Failed to process CSV file');
    }

    // Reset file input
    event.target.value = '';
  };

  const handleExport = async () => {
    setError('');
    setSuccess('');
    
    try {
      const csvData = await exportCoursesToCSV(courses);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `courses_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Courses data exported successfully!');
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const template = generateCSVTemplate();
      const blob = new Blob([template], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'course_upload_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Template downloaded successfully!');
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      credits: '',
      department: '',
      faculty: '',
      semester: '',
      teachers: '',
      description: '',
      type: ''
    });
    setEditingCourse(null);
    setShowAddForm(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Menu />
      <div style={{ marginLeft: 'var(--menu-width, 288px)' }} className="transition-all duration-300 p-8 min-h-screen font-sans">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white p-8 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold mb-2 flex items-center gap-3">
                  <FaBook className="text-2xl" />
                  Course Management
                </h1>
                <p className="text-lg opacity-90 font-light">
                  Manage courses, credits, and curriculum details
                </p>
              </div>
              
              {/* Statistics Cards */}
              {statistics && (
                <div className="flex gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <FaBook className="text-2xl mx-auto mb-2" />
                    <div className="text-2xl font-bold">{statistics.totalCourses || 0}</div>
                    <div className="text-sm opacity-80">Total Courses</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <FaBuilding className="text-2xl mx-auto mb-2" />
                    <div className="text-2xl font-bold">{statistics.departments || 0}</div>
                    <div className="text-sm opacity-80">Departments</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <FaGraduationCap className="text-2xl mx-auto mb-2" />
                    <div className="text-2xl font-bold">{statistics.totalCredits || 0}</div>
                    <div className="text-sm opacity-80">Total Credits</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FaPlus />
            Add New Course
          </button>
          
          <label className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm cursor-pointer">
            <FaUpload />
            Upload CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          
          <button
            onClick={handleExport}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FaDownload />
            Export CSV
          </button>
          
          <button
            onClick={handleDownloadTemplate}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FaFileExport />
            Download Template
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaCheckCircle />
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none w-64"
            />
          </div>
          
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
          >
            <option value="">All Departments</option>
            {[...new Set(courses.map(course => course.department).filter(Boolean))].map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Course Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FaBook className="text-slate-600" />
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Required Fields Section */}
                <div className="bg-slate-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <FaCheckCircle className="text-slate-600" />
                    Required Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiBookIcon className="inline mr-2" />
                        Course Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        placeholder="e.g., Introduction to Programming"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiHash className="inline mr-2" />
                        Course Code *
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        placeholder="e.g., CS101"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiAward className="inline mr-2" />
                        Credits *
                      </label>
                      <input
                        type="number"
                        name="credits"
                        value={formData.credits}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        placeholder="e.g., 3"
                        min="1"
                        max="10"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiBriefcase className="inline mr-2" />
                        Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="Theory">Theory</option>
                        <option value="Practical">Practical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaBuilding className="inline mr-2" />
                        Department *
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        placeholder="e.g., Computer Science"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaGraduationCap className="inline mr-2" />
                        Faculty *
                      </label>
                      <input
                        type="text"
                        name="faculty"
                        value={formData.faculty}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        placeholder="e.g., Engineering"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaCodeBranch className="inline mr-2" />
                        Semester *
                      </label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        required
                      >
                        <option value="">Select Semester</option>
                        {[1,2,3,4,5,6,7,8].map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Optional Fields Section */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <FiFileText className="text-slate-600" />
                    Optional Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaUsers className="inline mr-2" />
                        Teachers (Will be assigned later)
                      </label>
                      <input
                        type="text"
                        name="teachers"
                        value={formData.teachers}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none bg-gray-100"
                        placeholder="Will be assigned later"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiFileText className="inline mr-2" />
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                      placeholder="Course description, objectives, and overview..."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <FaSave />
                    {editingCourse ? 'Update Course' : 'Add Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Courses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FaBook className="text-slate-600" />
              Courses List ({courses.filter(course => 
                course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.code.toLowerCase().includes(searchTerm.toLowerCase())
              ).filter(course => 
                filterDepartment === '' || course.department === filterDepartment
              ).length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <FaSpinner className="animate-spin text-4xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center">
              <FaBook className="text-4xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No courses found. Add your first course!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Academic Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teachers
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses
                    .filter(course => 
                      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      course.code.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .filter(course => 
                      filterDepartment === '' || course.department === filterDepartment
                    )
                    .map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                <FaBook className="text-slate-600" />
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{course.name}</div>
                              <div className="text-sm text-gray-500 font-mono">{course.code}</div>
                              {course.description && (
                                <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                  {course.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {course.department && (
                              <div className="flex items-center gap-1 mb-1">
                                <FaBuilding className="text-xs text-gray-400" />
                                {course.department}
                              </div>
                            )}
                            {course.faculty && (
                              <div className="flex items-center gap-1 mb-1">
                                <FaGraduationCap className="text-xs text-gray-400" />
                                {course.faculty}
                              </div>
                            )}
                            {course.semester && (
                              <div className="flex items-center gap-1">
                                <FaCodeBranch className="text-xs text-gray-400" />
                                Semester {course.semester}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                course.type === 'Theory' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {course.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <FiAward className="text-xs text-gray-400" />
                              {course.credits} Credits
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {course.teachers ? (
                              <div className="flex items-center gap-1">
                                <FaUsers className="text-xs text-gray-400" />
                                {course.teachers}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Not assigned</span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(course)}
                              className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Course"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(course.id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Course"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseLoad;
