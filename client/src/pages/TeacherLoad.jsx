import React, { useState, useEffect } from 'react';
import Menu from '../Components/Menu';
import { 
  FaUsers, 
  FaUserPlus, 
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
  FaExclamationTriangle
} from 'react-icons/fa';
import { 
  FiFilter, 
  FiFileText, 
  FiMail, 
  FiPhone, 
  FiUser,
  FiBook,
  FiAward,
  FiBriefcase
} from 'react-icons/fi';
import {
  getAllTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  parseAndValidateCSV,
  batchUploadTeachers,
  generateCSVTemplate,
  exportTeachersToCSV,
  getTeacherStatistics
} from '../services/TeacherLoad';

const TeacherLoad = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    faculty: '',
    qualification: '',
    years: '',
    designation: '',
    email: '',
    phone: '',
    specialization: ''
  });

  // Load teachers on component mount
  useEffect(() => {
    loadTeachers();
    loadStatistics();
  }, []);

  // Load all teachers from Firebase
  const loadTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllTeachers();
      if (result.success) {
        setTeachers(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const result = await getTeacherStatistics();
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Get unique departments for filter
  const departments = [...new Set(teachers.map(teacher => teacher.department))];

  // Filter teachers based on search and department
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === '' || teacher.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (editingTeacher) {
        // Update existing teacher
        const result = await updateTeacher(editingTeacher.id, formData);
        if (result.success) {
          setSuccess('Teacher updated successfully!');
          await loadTeachers();
          await loadStatistics();
        } else {
          setError(result.error);
        }
      } else {
        // Add new teacher
        const result = await addTeacher(formData);
        if (result.success) {
          setSuccess('Teacher added successfully!');
          await loadTeachers();
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

  const handleEdit = (teacher) => {
    setFormData(teacher);
    setEditingTeacher(teacher);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      setError('');
      setSuccess('');
      
      try {
        const result = await deleteTeacher(id);
        if (result.success) {
          setSuccess('Teacher deleted successfully!');
          await loadTeachers();
          await loadStatistics();
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to delete teacher');
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');

    if (file.type !== 'text/csv') {
      setError('Please select a CSV file');
      return;
    }

    try {
      const csvText = await file.text();
      const parseResult = parseAndValidateCSV(csvText);
      
      if (!parseResult.isValid) {
        setError(`CSV validation failed: ${parseResult.errors.join(', ')}`);
        return;
      }

      // Confirm upload
      const confirmUpload = window.confirm(
        `Ready to upload ${parseResult.data.length} teachers. Continue?`
      );
      
      if (!confirmUpload) return;

      const uploadResult = await batchUploadTeachers(parseResult.data);
      if (uploadResult.success) {
        setSuccess(uploadResult.data.message);
        await loadTeachers();
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

  const handleExport = () => {
    try {
      const csvContent = exportTeachersToCSV(filteredTeachers);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `teachers_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Teachers data exported successfully!');
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
      link.download = 'teacher_upload_template.csv';
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
      department: '',
      faculty: '',
      qualification: '',
      years: '',
      designation: '',
      email: '',
      phone: '',
      specialization: ''
    });
    setEditingTeacher(null);
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-3xl font-semibold mb-2 flex items-center gap-3">
                  <FaUsers className="text-2xl" />
                  Teacher Management
                </h1>
                <p className="text-lg opacity-90 font-light">
                  Manage faculty data, upload records, and maintain teacher information
                </p>
              </div>
              
              {/* Statistics Cards */}
              {statistics && (
                <div className="flex gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <FaUsers className="text-2xl mx-auto mb-2" />
                    <div className="text-2xl font-bold">{statistics.totalTeachers || 0}</div>
                    <div className="text-sm opacity-80">Total Teachers</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <FaBuilding className="text-2xl mx-auto mb-2" />
                    <div className="text-2xl font-bold">{statistics.totalDepartments || 0}</div>
                    <div className="text-sm opacity-80">Departments</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <FaGraduationCap className="text-2xl mx-auto mb-2" />
                    <div className="text-2xl font-bold">{statistics.totalFaculties || 0}</div>
                    <div className="text-sm opacity-80">Faculties</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {(success || error) && (
          <div className={`mb-6 p-4 rounded-lg border ${success ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            <div className="flex items-center gap-3">
              {success ? <FaCheckCircle className="text-lg" /> : <FaExclamationTriangle className="text-lg" />}
              <span className="font-medium">{success || error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <FaSpinner className="text-4xl text-slate-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-slate-700">Loading teachers...</h3>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FaUserPlus />
            Add New Teacher
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
            disabled={filteredTeachers.length === 0}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
          >
            <FaFileExport />
            Export CSV
          </button>
          
          <button
            onClick={handleDownloadTemplate}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FiFileText />
            Download Template
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search teachers..."
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
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-3">
                  {editingTeacher ? <FaEdit className="text-xl" /> : <FaUserPlus className="text-xl" />}
                  {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-slate-500 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Required Fields Section */}
                <div className="md:col-span-2 mb-4">
                  <h3 className="text-lg font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaExclamationTriangle className="text-orange-500 text-sm" />
                    Required Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <FiUser className="text-sm" />
                        Teacher Code *
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., T001"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <FiUser className="text-sm" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., Dr. John Smith"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <FaBuilding className="text-sm" />
                        Department *
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <FaGraduationCap className="text-sm" />
                        Faculty *
                      </label>
                      <input
                        type="text"
                        name="faculty"
                        value={formData.faculty}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., Engineering"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Fields Section */}
                <div className="md:col-span-2 mb-4">
                  <h3 className="text-lg font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FiBook className="text-blue-500 text-sm" />
                    Additional Information (Optional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <FiBriefcase className="text-sm" />
                        Designation
                      </label>
                      <select
                        name="designation"
                        value={formData.designation}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                      >
                        <option value="">Select Designation</option>
                        <option value="Professor">Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Senior Lecturer">Senior Lecturer</option>
                        <option value="Instructor">Instructor</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <FiMail className="text-sm" />
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., john.smith@university.edu"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <FiPhone className="text-sm" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., +1-234-567-8900"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <FiAward className="text-sm" />
                        Qualification
                      </label>
                      <input
                        type="text"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., PhD Computer Science"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <FiBook className="text-sm" />
                        Years of Experience
                      </label>
                      <input
                        type="text"
                        name="years"
                        value={formData.years}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., 10"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Specialization</label>
                      <textarea
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., Machine Learning, Artificial Intelligence, Data Structures"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2 flex gap-4 pt-6 border-t border-slate-200">
                  <button
                    type="submit"
                    className="flex-1 bg-slate-700 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <FaSave className="text-sm" />
                    {editingTeacher ? 'Update Teacher' : 'Add Teacher'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-slate-400 text-white py-3 rounded-lg font-medium hover:bg-slate-500 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <FaTimes className="text-sm" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Teachers Table */}
        {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <FaUsers className="text-lg" />
              Teachers Database ({filteredTeachers.length} records)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Faculty</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTeachers.map((teacher, index) => (
                  <tr key={teacher.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                      {teacher.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{teacher.name}</div>
                      <div className="text-sm text-slate-500">{teacher.qualification}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {teacher.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {teacher.faculty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                        {teacher.designation}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {teacher.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {teacher.years} {teacher.years && 'years'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors duration-200 flex items-center gap-1"
                        >
                          <FaEdit className="text-xs" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="text-red-600 hover:text-red-800 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors duration-200 flex items-center gap-1"
                        >
                          <FaTrash className="text-xs" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredTeachers.length === 0 && (
              <div className="text-center py-16">
                <FaUsers className="text-5xl text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">No teachers found</h3>
                <p className="text-slate-500 mb-6">
                  {searchTerm || filterDepartment ? 'Try adjusting your search or filter criteria.' : 'Get started by adding your first teacher.'}
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors duration-200 flex items-center gap-2 mx-auto"
                >
                  <FaUserPlus className="text-sm" />
                  Add First Teacher
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default TeacherLoad;
