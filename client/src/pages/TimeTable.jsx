import React, { useState } from 'react';
import Menu from '../Components/Menu';
import { 
  FaCalendarAlt,
  FaPlus,
  FaTimes,
  FaCopy,
  FaExpand,
  FaCompress,
  FaExclamationTriangle,
  FaCheck,
  FaClock,
  FaUsers,
  FaBuilding
} from 'react-icons/fa';
import { 
  FiSave,
  FiDownload,
  FiUpload,
  FiSettings
} from 'react-icons/fi';

const TimeTable = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabs, setTabs] = useState([
    {
      id: 1,
      name: 'New Timetable',
      course: '',
      branch: '',
      semester: '',
      type: '',
      batch: '',
      isActive: true
    }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);

  // Time slots and days
  const timeSlots = [
    '9:00-10:00',
    '10:00-11:00', 
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Data for dropdowns
  const courses = ['BTech', 'BSc', 'MSc', 'MTech', 'MBA'];
  const branches = ['Computer Science', 'Electrical', 'Mechanical', 'Mathematics', 'Physics'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const types = ['Full Time', 'Part Time'];
  const subjects = [];
  const teachers = [];
  const rooms = [];

  // Timetable data structure
  const [timetableData, setTimetableData] = useState({});

  // Conflicts and errors
  const [conflicts, setConflicts] = useState([]);

  const getActiveTab = () => tabs.find(tab => tab.id === activeTabId);

  const generateTabName = (course, branch, semester, type, batch) => {
    if (!course || !branch || !semester || !type) {
      return 'New Timetable';
    }
    const shortCourse = course.substring(0, 4);
    const shortBranch = branch.split(' ').map(word => word[0]).join('');
    const batchSuffix = batch ? `-${batch}` : '';
    return `${shortCourse}-${shortBranch}-Sem${semester}-${type.split(' ')[0]}${batchSuffix}`;
  };

  const addNewTab = () => {
    const newTab = {
      id: nextTabId,
      name: `New Timetable ${nextTabId}`,
      course: '',
      branch: '',
      semester: '',
      type: '',
      batch: '',
      isActive: false
    };
    
    setTabs([...tabs, newTab]);
    setActiveTabId(nextTabId);
    setNextTabId(nextTabId + 1);
  };

  const closeTab = (tabId) => {
    if (tabs.length === 1) return; // Don't close last tab
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const updateTabField = (field, value) => {
    const activeTab = getActiveTab();
    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        const updatedTab = { ...tab, [field]: value };
        updatedTab.name = generateTabName(
          updatedTab.course,
          updatedTab.branch,
          updatedTab.semester,
          updatedTab.type,
          updatedTab.batch
        );
        return updatedTab;
      }
      return tab;
    });
    setTabs(updatedTabs);
  };

  const splitBatch = () => {
    const batchNames = prompt('Enter batch names separated by commas (e.g., Batch A, Batch B):');
    if (!batchNames) return;

    const batches = batchNames.split(',').map(name => name.trim());
    const activeTab = getActiveTab();
    const newTabs = [];

    batches.forEach((batchName, index) => {
      if (index === 0) {
        // Update current tab
        updateTabField('batch', batchName);
      } else {
        // Create new tabs
        const newTab = {
          ...activeTab,
          id: nextTabId + index - 1,
          batch: batchName,
          name: generateTabName(
            activeTab.course,
            activeTab.branch,
            activeTab.semester,
            activeTab.type,
            batchName
          )
        };
        newTabs.push(newTab);
      }
    });

    setTabs([...tabs, ...newTabs]);
    setNextTabId(nextTabId + batches.length - 1);
  };

  const getCellKey = (day, timeSlot) => `${activeTabId}-${day}-${timeSlot}`;

  const updateCell = (day, timeSlot, field, value) => {
    const key = getCellKey(day, timeSlot);
    setTimetableData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const getCellData = (day, timeSlot) => {
    const key = getCellKey(day, timeSlot);
    return timetableData[key] || { subject: '', teacher: '', room: '' };
  };

  const activeTab = getActiveTab();

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-50 flex flex-col' : 'min-h-screen bg-gray-50'}`}>
      {!isFullscreen && <Menu />}
      
      <div style={{ marginLeft: isFullscreen ? '0' : 'var(--menu-width, 288px)' }} className={`transition-all duration-300 flex flex-col ${isFullscreen ? 'h-full' : 'min-h-screen'}`}>
        
        {/* Header Section */}
        {!isFullscreen && (
        <div className="p-8 pb-6 flex-shrink-0">
          <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-600 text-white p-8 rounded-xl shadow-sm border border-slate-200 relative">
            <h1 className="text-3xl font-semibold mb-2 flex items-center gap-3">
              <FaCalendarAlt className="text-2xl" />
              Timetable Creation Studio
            </h1>
            <p className="text-lg opacity-90 font-light">
              Create and manage multiple timetables simultaneously with intelligent conflict detection
            </p>
            
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="absolute top-4 right-4 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Toggle Fullscreen"
            >
              <FaExpand className="text-lg" />
            </button>
          </div>
        </div>
        )}

        {/* Fullscreen Header */}
        {isFullscreen && (
        <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-600 text-white p-4 flex items-center justify-between flex-shrink-0">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <FaCalendarAlt />
            Timetable Creation Studio
          </h1>
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="Exit Fullscreen"
          >
            <FaCompress className="text-lg" />
          </button>
        </div>
        )}

        <div className="flex flex-1 min-h-0">
          {/* Main Content */}
          <div className={`flex-1 px-4 pb-4 min-w-0 overflow-y-auto flex flex-col ${isFullscreen ? 'h-full' : ''}`}>
            
            {/* Tabs Section */}
            <div className="bg-white rounded-t-xl shadow-sm border border-slate-200 border-b-0">
              <div className="flex items-center bg-slate-50 px-4 py-2 rounded-t-xl border-b border-slate-200">
                <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <div
                      key={tab.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-all min-w-max ${
                        tab.id === activeTabId
                          ? 'bg-white border-t border-l border-r border-slate-200 text-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      onClick={() => setActiveTabId(tab.id)}
                    >
                      <span className="text-sm font-medium truncate max-w-32">{tab.name}</span>
                      {tabs.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.id);
                          }}
                          className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    onClick={addNewTab}
                    className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Add New Tab"
                  >
                    <FaPlus className="text-xs" />
                    <span className="text-sm">New</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-4">
              
              {/* Tab Configuration Fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
                  <select
                    value={activeTab?.course || ''}
                    onChange={(e) => updateTabField('course', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                  <select
                    value={activeTab?.branch || ''}
                    onChange={(e) => updateTabField('branch', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Semester</label>
                  <select
                    value={activeTab?.semester || ''}
                    onChange={(e) => updateTabField('semester', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    value={activeTab?.type || ''}
                    onChange={(e) => updateTabField('type', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Type</option>
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={splitBatch}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    title="Split into batches"
                  >
                    <FaCopy className="text-sm" />
                    Split Batch
                  </button>
                </div>
              </div>

              {/* Batch Info */}
              {activeTab?.batch && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Batch:</strong> {activeTab.batch}
                  </p>
                </div>
              )}

              {/* Action Buttons - now moved to Utils Panel */}
              <div className="xl:hidden mb-4 flex gap-3 flex-wrap">
                {/* Mobile Conflict Indicator */}
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center gap-2">
                  <FaExclamationTriangle className="text-sm" />
                  Conflicts ({conflicts.length})
                </button>
              </div>

              {/* Timetable Grid */}
              <div className="flex-1 overflow-auto border border-slate-200 rounded-lg min-h-0">
                <table className="w-full table-fixed">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-20">Time</th>
                      {days.map(day => (
                        <th key={day} className="px-1 py-2 text-center text-xs font-medium text-slate-700 border-r border-slate-200 last:border-r-0 w-32">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((timeSlot, timeIndex) => (
                      <tr key={timeSlot} className="border-b border-slate-200 last:border-b-0">
                        <td className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-50 border-r border-slate-200">
                          {timeSlot}
                        </td>
                        {days.map((day, dayIndex) => {
                          const cellData = getCellData(day, timeSlot);
                          return (
                            <td key={`${day}-${timeSlot}`} className="p-1 border-r border-slate-200 last:border-r-0">
                              <div className="space-y-0.5">
                                <select
                                  value={cellData.subject}
                                  onChange={(e) => updateCell(day, timeSlot, 'subject', e.target.value)}
                                  className="w-full px-1 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none"
                                >
                                  <option value="">Subject</option>
                                  {subjects.map(subject => (
                                    <option key={subject} value={subject}>{subject}</option>
                                  ))}
                                </select>
                                
                                <select
                                  value={cellData.teacher}
                                  onChange={(e) => updateCell(day, timeSlot, 'teacher', e.target.value)}
                                  className="w-full px-1 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none"
                                >
                                  <option value="">Teacher</option>
                                  {teachers.map(teacher => (
                                    <option key={teacher} value={teacher}>{teacher}</option>
                                  ))}
                                </select>
                                
                                <select
                                  value={cellData.room}
                                  onChange={(e) => updateCell(day, timeSlot, 'room', e.target.value)}
                                  className="w-full px-1 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none"
                                >
                                  <option value="">Room</option>
                                  {rooms.map(room => (
                                    <option key={room} value={room}>{room}</option>
                                  ))}
                                </select>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Fixed Right Panel - Utils & Tools */}
          <div className={`w-64 bg-white border-l border-slate-200 shadow-sm sticky top-0 overflow-y-auto shrink-0 hidden xl:block ${isFullscreen ? 'h-full' : 'h-screen'}`}>
            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-medium text-slate-800 flex items-center gap-2 text-sm">
                <FiSettings className="text-indigo-500" />
                Utils & Tools
              </h3>
            </div>
            
            {/* Action Buttons Section */}
            <div className="p-3 border-b border-slate-200">
              <h4 className="font-medium text-slate-700 mb-2 text-xs">Actions</h4>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs">
                  <FiSave className="text-xs" />
                  Save Timetable
                </button>
                <button className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 text-xs">
                  <FiDownload className="text-xs" />
                  Export
                </button>
                <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 text-xs">
                  <FiUpload className="text-xs" />
                  Import
                </button>
              </div>
            </div>
            
            {/* Conflicts Section */}
            <div className="p-3 border-b border-slate-200">
              <h4 className="font-medium text-slate-700 mb-2 text-xs flex items-center gap-2">
                <FaExclamationTriangle className="text-orange-500" />
                Conflicts & Issues
              </h4>
            
            <div className="p-2 space-y-2">
              {conflicts.length === 0 ? (
                <div className="text-center py-4">
                  <FaCheck className="text-xl text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">No conflicts detected</p>
                </div>
              ) : (
                conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg border-l-4 ${
                      conflict.severity === 'high'
                        ? 'bg-red-50 border-red-400 text-red-700'
                        : 'bg-orange-50 border-orange-400 text-orange-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {conflict.type === 'teacher' && <FaUsers className="text-xs mt-0.5" />}
                      {conflict.type === 'room' && <FaBuilding className="text-xs mt-0.5" />}
                      {conflict.type === 'hours' && <FaClock className="text-xs mt-0.5" />}
                      <p className="text-xs">{conflict.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            </div>

            {/* Statistics */}
            <div className="border-t border-slate-200 p-3">
              <h4 className="font-medium text-slate-700 mb-2 text-sm">Statistics</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Classes:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Teachers Used:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Rooms Used:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Conflicts:</span>
                  <span className={`font-medium ${conflicts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {conflicts.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTable;