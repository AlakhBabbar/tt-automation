import { useState, useEffect } from 'react';
import Menu from '../Components/Menu';
import { 
  FaBook, 
  FaPlus, 
  FaTimes, 
  FaSave, 
  FaEdit, 
  FaTrash,
  FaGraduationCap,
  FaFlask,
  FaClock,
  FaChalkboardTeacher,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const ClassCurriculum = () => {
  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    program: '',
    branch: '',
    semester: '',
    batch: '',
    type: 'full-time',
    academicYear: ''
  });

  // Class suggestions for quick setup
  const classSuggestions = [
    { program: 'B.Tech', branch: 'Computer Science', semester: 1 },
    { program: 'B.Tech', branch: 'Electrical', semester: 1 },
    { program: 'B.Tech', branch: 'Mechanical', semester: 1 },
    { program: 'B.Tech', branch: 'Civil', semester: 1 },
    { program: 'B.Tech', branch: 'Electronics', semester: 1 },
    { program: 'B.Tech', branch: 'IT', semester: 1 }
  ];

  // Load curriculums and courses on mount
  useEffect(() => {
    loadCurriculums();
    loadCourses();
  }, []);

  const loadCurriculums = async () => {
    try {
      setLoading(true);
      const curriculumRef = collection(db, 'classCurriculum');
      const snapshot = await getDocs(curriculumRef);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCurriculums(data);
    } catch (error) {
      console.error('Error loading curriculums:', error);
      alert('Failed to load curriculums');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const coursesRef = collection(db, 'courses');
      const snapshot = await getDocs(coursesRef);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
      alert('Failed to load courses from Firebase');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fillSuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      program: suggestion.program,
      branch: suggestion.branch,
      semester: suggestion.semester.toString()
    }));
  };

  const toggleCourseSelection = (course) => {
    setSelectedCourses(prev => {
      const isSelected = prev.find(c => c.id === course.id);
      if (isSelected) {
        return prev.filter(c => c.id !== course.id);
      } else {
        return [...prev, course];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.program || !formData.branch || !formData.semester) {
      alert('Please fill in required fields (Program, Branch, Semester)');
      return;
    }

    if (selectedCourses.length === 0) {
      alert('Please select at least one course');
      return;
    }

    try {
      setSaving(true);
      const curriculumRef = collection(db, 'classCurriculum');

      const dataToSave = {
        ...formData,
        courses: selectedCourses,
        totalCourses: selectedCourses.length,
        totalCredits: selectedCourses.reduce((sum, c) => sum + parseFloat(c.credits || 0), 0),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        // Update existing
        const docRef = doc(db, 'classCurriculum', editingId);
        await updateDoc(docRef, dataToSave);
        alert('Curriculum updated successfully!');
      } else {
        // Add new
        dataToSave.createdAt = serverTimestamp();
        await addDoc(curriculumRef, dataToSave);
        alert('Curriculum added successfully!');
      }

      resetForm();
      setShowModal(false);
      loadCurriculums();
    } catch (error) {
      console.error('Error saving curriculum:', error);
      alert('Failed to save curriculum');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (curriculum) => {
    setEditingId(curriculum.id);
    setFormData({
      program: curriculum.program,
      branch: curriculum.branch,
      semester: curriculum.semester,
      batch: curriculum.batch || '',
      type: curriculum.type || 'full-time',
      academicYear: curriculum.academicYear || ''
    });
    setSelectedCourses(curriculum.courses || []);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this curriculum?')) return;

    try {
      await deleteDoc(doc(db, 'classCurriculum', id));
      alert('Curriculum deleted successfully!');
      loadCurriculums();
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      alert('Failed to delete curriculum');
    }
  };

  const resetForm = () => {
    setFormData({
      program: '',
      branch: '',
      semester: '',
      batch: '',
      type: 'full-time',
      academicYear: ''
    });
    setSelectedCourses([]);
    setEditingId(null);
  };

  const filteredCurriculums = curriculums.filter(curr => {
    const matchesSearch = 
      curr.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curr.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curr.semester?.toString().includes(searchTerm);
    
    const matchesFilter = 
      filterType === 'all' || 
      curr.type === filterType;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Menu />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <FaGraduationCap className="text-indigo-600 text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Class Curriculum Management</h1>
                <p className="text-gray-600 text-sm mt-1">Manage course assignments and class schedules</p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <FaPlus />
              Add Curriculum
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by program, branch, or semester..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Curriculum List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading curriculums...</p>
          </div>
        ) : filteredCurriculums.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FaBook className="text-gray-300 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Curriculums Found</h3>
            <p className="text-gray-600 mb-6">Start by adding a new class curriculum</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <FaPlus />
              Add Your First Curriculum
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCurriculums.map(curriculum => (
              <div key={curriculum.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">
                        {curriculum.program} - {curriculum.branch}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                          Semester {curriculum.semester}
                        </span>
                        <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full capitalize">
                          {curriculum.type}
                        </span>
                        {curriculum.batch && (
                          <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                            Batch {curriculum.batch}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(curriculum)}
                        className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(curriculum.id)}
                        className="p-2 bg-white/20 hover:bg-red-500 text-white rounded-lg transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <FaBook className="text-blue-600 text-lg mx-auto mb-1" />
                      <div className="text-2xl font-bold text-blue-900">{curriculum.totalCourses}</div>
                      <div className="text-xs text-blue-600">Courses</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <FaGraduationCap className="text-green-600 text-lg mx-auto mb-1" />
                      <div className="text-2xl font-bold text-green-900">{curriculum.totalCredits}</div>
                      <div className="text-xs text-green-600">Credits</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <FaFlask className="text-purple-600 text-lg mx-auto mb-1" />
                      <div className="text-2xl font-bold text-purple-900">
                        {curriculum.courses?.filter(c => c.type === 'lab' || c.courseType === 'lab').length || 0}
                      </div>
                      <div className="text-xs text-purple-600">Labs</div>
                    </div>
                  </div>

                  {/* Courses List */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Courses:</h4>
                    {curriculum.courses?.map((course, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className={`p-2 rounded-lg ${(course.type === 'lab' || course.courseType === 'lab') ? 'bg-purple-100' : 'bg-blue-100'}`}>
                          {(course.type === 'lab' || course.courseType === 'lab') ? (
                            <FaFlask className={`text-purple-600 text-sm`} />
                          ) : (
                            <FaBook className={`text-blue-600 text-sm`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-800 text-sm">{course.name || course.courseName}</h5>
                              <p className="text-xs text-gray-600 mt-0.5">{course.code || course.courseCode}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded font-medium">
                                {course.credits} Credits
                              </span>
                              {(course.hoursPerWeek || course.hours) && (
                                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                                  {course.hoursPerWeek || course.hours}h/w
                                </span>
                              )}
                            </div>
                          </div>
                          {(course.teacher || course.teacherAssigned) && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                              <FaChalkboardTeacher />
                              <span>{course.teacher || course.teacherAssigned}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingId ? 'Edit Curriculum' : 'Add New Curriculum'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Quick Class Suggestions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Class Setup</h3>
                  <div className="flex flex-wrap gap-2">
                    {classSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => fillSuggestion(suggestion)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded-full text-xs font-medium transition-colors border border-gray-200 hover:border-indigo-300"
                      >
                        {suggestion.program} {suggestion.branch} - Sem {suggestion.semester}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Class Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaGraduationCap className="text-indigo-600" />
                    Class Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Program <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="program"
                        value={formData.program}
                        onChange={handleInputChange}
                        placeholder="e.g., B.Tech"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        placeholder="e.g., Electrical"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semester <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        placeholder="e.g., 1"
                        min="1"
                        max="12"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Batch
                      </label>
                      <input
                        type="text"
                        name="batch"
                        value={formData.batch}
                        onChange={handleInputChange}
                        placeholder="e.g., A"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Academic Year
                      </label>
                      <input
                        type="text"
                        name="academicYear"
                        value={formData.academicYear}
                        onChange={handleInputChange}
                        placeholder="e.g., 2024-25"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Select Courses Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaBook className="text-indigo-600" />
                    Select Courses ({selectedCourses.length} selected)
                  </h3>
                  
                  {availableCourses.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <FaBook className="text-gray-300 text-3xl mx-auto mb-3" />
                      <p className="text-gray-600 text-sm">No courses available. Please add courses first.</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2 bg-gray-50 rounded-lg p-4">
                      {availableCourses.map((course) => {
                        const isSelected = selectedCourses.find(c => c.id === course.id);
                        return (
                          <div
                            key={course.id}
                            onClick={() => toggleCourseSelection(course)}
                            className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-500'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={!!isSelected}
                                onChange={() => {}}
                                className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800 text-sm">
                                  {course.name || course.courseName}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center gap-3 mt-1 flex-wrap">
                                  <span>{course.code || course.courseCode}</span>
                                  {course.credits && (
                                    <>
                                      <span>•</span>
                                      <span>{course.credits} Credits</span>
                                    </>
                                  )}
                                  {course.type && (
                                    <>
                                      <span>•</span>
                                      <span className="capitalize">{course.type}</span>
                                    </>
                                  )}
                                  {course.teacher && (
                                    <>
                                      <span>•</span>
                                      <FaChalkboardTeacher className="inline" />
                                      <span>{course.teacher}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Curriculum
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassCurriculum;
