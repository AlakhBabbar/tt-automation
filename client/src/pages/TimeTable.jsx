import React, { useState, useEffect } from 'react';
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
  FaBuilding,
  FaSpinner,
  FaCheckCircle,
  FaLock,
  FaChevronDown
} from 'react-icons/fa';
import { 
  FiSave,
  FiDownload,
  FiUpload,
  FiSettings
} from 'react-icons/fi';

// Import TimeTable service functions
import {
  getAllTimetables,
  findTimetableByFields,
  addTimetable,
  updateTimetable,
  updateTimeSlot,
  deleteTimetable,
  getCourses,
  getTeachers,
  getRooms,
  checkTimeSlotConflicts,
  checkRealTimeConflicts,
  getTimetableStatistics,
  TIME_SLOTS,
  WEEKDAYS,
  createEmptyTimetable
} from '../services/TimeTable';

const TimeTable = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Timetable data
  const [timetables, setTimetables] = useState([]);
  const [currentTimetable, setCurrentTimetable] = useState(null);
  const [statistics, setStatistics] = useState(null);
  
  // External data
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Tab management
  const [tabs, setTabs] = useState([
    {
      id: 1,
      name: 'New Timetable',
      timetableId: null,
      course: '',
      branch: '',
      semester: '',
      type: '',
      batch: '',
      isActive: true,
      isModified: false
    }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);

  // Conflicts and validation
  const [conflicts, setConflicts] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    teachersUsed: 0,
    roomsUsed: 0
  });

  // Timetable browser modal
  const [showTimetableModal, setShowTimetableModal] = useState(false);

  // Temporary data storage for unsaved changes
  const [tempTimetableData, setTempTimetableData] = useState({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load timetable when active tab changes
  useEffect(() => {
    const activeTab = getActiveTab();
    if (activeTab) {
      if (activeTab.timetableId) {
        loadTimetableForTab(activeTab.timetableId);
      } else {
        // For new tabs, check if we have temporary data
        const tempData = tempTimetableData[activeTab.id];
        if (tempData) {
          setCurrentTimetable(tempData);
          // Calculate stats for temp data
          getTimetableStatistics(tempData).then(statistics => {
            if (statistics.success) {
              setStats(statistics.data);
            }
          });
        } else {
          // Initialize with empty timetable
          const emptyTimetable = createEmptyTimetable();
          setCurrentTimetable(emptyTimetable);
          setStats({
            totalClasses: 0,
            teachersUsed: 0,
            roomsUsed: 0
          });
        }
      }
    }
  }, [activeTabId, timetables, tempTimetableData]);

  // Close modal when pressing escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showTimetableModal) {
        setShowTimetableModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showTimetableModal]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [timetablesResult, coursesResult, teachersResult, roomsResult, statsResult] = await Promise.all([
        getAllTimetables(),
        getCourses(),
        getTeachers(),
        getRooms(),
        getTimetableStatistics()
      ]);

      if (timetablesResult.success) {
        setTimetables(timetablesResult.data);
      }
      
      if (coursesResult.success) {
        setCourses(coursesResult.data);
      }
      
      if (teachersResult.success) {
        setTeachers(teachersResult.data);
      }
      
      if (roomsResult.success) {
        setRooms(roomsResult.data);
      }
      
      if (statsResult.success) {
        setStatistics(statsResult.data);
      }
    } catch (err) {
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Time slots and days from service
  const timeSlots = TIME_SLOTS;
  const days = WEEKDAYS.map(day => day.charAt(0).toUpperCase() + day.slice(1));

  const getActiveTab = () => tabs.find(tab => tab.id === activeTabId);

  const isTimetableUnlocked = (tab) => {
    console.log('Checking unlock status for tab:', tab); // Debug log
    const isUnlocked = tab && tab.course && tab.branch && tab.semester && tab.type;
    console.log('Is unlocked:', isUnlocked, {
      hasTab: !!tab,
      course: tab?.course,
      branch: tab?.branch,
      semester: tab?.semester,
      type: tab?.type,
      batch: tab?.batch
    }); // Debug log
    return isUnlocked;
  };

  const generateTabName = (course, branch, semester, type, batch) => {
    if (!course || !branch || !semester || !type) {
      return 'New Timetable';
    }
    const batchSuffix = batch ? `-${batch}` : '';
    return `${course}-${branch}-Sem${semester}-${type === 'full-time' ? 'FT' : 'PT'}${batchSuffix}`;
  };

  const addNewTab = () => {
    const newTab = {
      id: nextTabId,
      name: `New Timetable ${nextTabId}`,
      timetableId: null,
      course: '',
      branch: '',
      semester: '',
      type: '',
      batch: '',
      isActive: false,
      isModified: false
    };
    
    setTabs([...tabs, newTab]);
    setActiveTabId(nextTabId);
    setCurrentTimetable(createEmptyTimetable());
    setNextTabId(nextTabId + 1);
  };

  const openExistingTimetable = (timetable) => {
    // Check if this timetable is already open in a tab
    const existingTab = tabs.find(tab => tab.timetableId === timetable.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      setShowTimetableModal(false);
      return;
    }

    // Create new tab for existing timetable
    const newTab = {
      id: nextTabId,
      name: generateTabName(timetable.course, timetable.branch, timetable.semester, timetable.type, timetable.batch),
      timetableId: timetable.id,
      course: timetable.course,
      branch: timetable.branch,
      semester: timetable.semester,
      type: timetable.type,
      batch: timetable.batch || '',
      isActive: false,
      isModified: false
    };
    
    setTabs([...tabs, newTab]);
    setActiveTabId(nextTabId);
    setCurrentTimetable(timetable);
    setNextTabId(nextTabId + 1);
    setShowTimetableModal(false);

    // Calculate stats for loaded timetable
    getTimetableStatistics(timetable).then(statistics => {
      if (statistics.success) {
        setStats(statistics.data);
      }
    });
  };

  const closeTab = async (tabId) => {
    if (tabs.length === 1) return;
    
    const tabToClose = tabs.find(tab => tab.id === tabId);
    if (tabToClose?.isModified) {
      const confirmClose = window.confirm('This tab has unsaved changes. Are you sure you want to close it?');
      if (!confirmClose) return;
    }
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      const newActiveTab = newTabs[0];
      setActiveTabId(newActiveTab.id);
      
      // Load timetable data for new active tab
      if (newActiveTab.timetableId) {
        await loadTimetableForTab(newActiveTab.timetableId);
      } else {
        setCurrentTimetable(createEmptyTimetable());
      }
    }
  };

  const updateTabField = (field, value) => {
    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        const updatedTab = { ...tab, [field]: value, isModified: true };
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
    
    // Check if we should auto-load an existing timetable
    const activeTab = updatedTabs.find(tab => tab.id === activeTabId);
    if (activeTab && activeTab.course && activeTab.branch && activeTab.semester && activeTab.type) {
      checkForExistingTimetable(activeTab);
    }
  };

  const checkForExistingTimetable = async (tab) => {
    try {
      // Only check if this is a new timetable (no timetableId)
      if (tab.timetableId) return;
      
      const result = await findTimetableByFields(
        tab.course,
        tab.branch, 
        tab.semester,
        tab.type,
        tab.batch
      );
      
      if (result.success && result.data) {
        // Found existing timetable - load it
        const existingTimetable = result.data;
        setCurrentTimetable(existingTimetable);
        
        // Update tab to reference this timetable
        const updatedTabs = tabs.map(t => {
          if (t.id === tab.id) {
            return {
              ...t,
              timetableId: existingTimetable.id,
              isModified: false
            };
          }
          return t;
        });
        setTabs(updatedTabs);
        
        // Calculate stats for loaded timetable
        const statistics = await getTimetableStatistics(existingTimetable);
        if (statistics.success) {
          setStats(statistics.data);
        }
        
        setSuccess(`Found and loaded existing timetable: ${existingTimetable.course} ${existingTimetable.branch}`);
      }
    } catch (error) {
      console.error('Error checking for existing timetable:', error);
    }
  };

  const loadTimetableForTab = async (timetableId) => {
    const timetable = timetables.find(tt => tt.id === timetableId);
    if (timetable) {
      setCurrentTimetable(timetable);
      
      // Calculate and update statistics
      const statistics = await getTimetableStatistics(timetable);
      setStats(statistics);
    }
  };

  const saveTimetable = async () => {
    const activeTab = getActiveTab();
    if (!activeTab) return;

    if (!activeTab.course || !activeTab.branch || !activeTab.semester || !activeTab.type) {
      setError('Please fill all required fields (Course, Branch, Semester, Type)');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Create clean timetable data structure
      const timetableData = {
        course: activeTab.course,
        branch: activeTab.branch,
        semester: activeTab.semester,
        type: activeTab.type
      };

      // Only include batch if it exists
      if (activeTab.batch) {
        timetableData.batch = activeTab.batch;
      }

      // Add the schedule data (monday, tuesday, etc.)
      WEEKDAYS.forEach(day => {
        if (currentTimetable[day]) {
          // Only include time slots that have at least one field filled
          const daySchedule = {};
          Object.keys(currentTimetable[day]).forEach(timeSlot => {
            const slot = currentTimetable[day][timeSlot];
            // Include slot even if some fields are empty - this allows partial schedules
            if (slot && (slot.course || slot.teacher || slot.room)) {
              daySchedule[timeSlot] = {
                course: slot.course || '',
                teacher: slot.teacher || '',
                room: slot.room || ''
              };
            }
          });
          // Only add the day if it has at least one time slot
          if (Object.keys(daySchedule).length > 0) {
            timetableData[day] = daySchedule;
          }
        }
      });

      let result;
      if (activeTab.timetableId) {
        // Update existing timetable
        result = await updateTimetable(activeTab.timetableId, timetableData);
      } else {
        // Create new timetable
        result = await addTimetable(timetableData);
      }

      if (result.success) {
        setSuccess('Timetable saved successfully!');
        
        // Update tabs to mark as saved
        const updatedTabs = tabs.map(tab => {
          if (tab.id === activeTabId) {
            return {
              ...tab,
              timetableId: result.data.id,
              isModified: false
            };
          }
          return tab;
        });
        setTabs(updatedTabs);
        
        // Reload timetables and statistics
        await loadInitialData();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const updateTimeSlotData = async (day, timeSlot, field, value) => {
    console.log('updateTimeSlotData called:', day, timeSlot, field, value); // Debug log
    if (!currentTimetable) return;
    
    const activeTab = getActiveTab();
    
    // Block editing if timetable is not unlocked
    if (!isTimetableUnlocked(activeTab)) {
      setError('Please fill all required fields (Course, Branch, Semester, Type) to start editing the timetable.');
      return;
    }
    
    const dayKey = day.toLowerCase();
    const updatedTimetable = { ...currentTimetable };
    
    if (!updatedTimetable[dayKey]) {
      updatedTimetable[dayKey] = {};
    }
    
    if (!updatedTimetable[dayKey][timeSlot]) {
      updatedTimetable[dayKey][timeSlot] = { course: '', teacher: '', room: '' };
    }
    
    updatedTimetable[dayKey][timeSlot][field] = value;
    setCurrentTimetable(updatedTimetable);
    
    // Store in temporary data if this is a new timetable
    if (!activeTab.timetableId) {
      setTempTimetableData(prev => ({
        ...prev,
        [activeTab.id]: updatedTimetable
      }));
    }
    
    // Calculate and update statistics
    const statistics = await getTimetableStatistics(updatedTimetable);
    setStats(statistics);
    
    // Mark tab as modified
    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        return { ...tab, isModified: true };
      }
      return tab;
    });
    setTabs(updatedTabs);
    
    // Real-time conflict detection - check whenever teacher or room is assigned
    if (updatedTimetable[dayKey][timeSlot].teacher || updatedTimetable[dayKey][timeSlot].room) {
      const conflicts = await checkRealTimeConflicts(
        tempTimetableData,
        dayKey,
        timeSlot,
        updatedTimetable[dayKey][timeSlot],
        activeTab.id
      );
      
      const conflictKey = `${dayKey}-${timeSlot}`;
      if (conflicts.length > 0) {
        setConflicts(prev => [
          ...prev.filter(c => c.key !== conflictKey),
          ...conflicts.map(conflict => ({
            key: conflictKey,
            ...conflict
          }))
        ]);
      } else {
        setConflicts(prev => prev.filter(c => c.key !== conflictKey));
      }
    }
  };

  const getTimeSlotData = (day, timeSlot) => {
    if (!currentTimetable) return { course: '', teacher: '', room: '' };
    
    const dayKey = day.toLowerCase();
    const data = currentTimetable[dayKey]?.[timeSlot] || { course: '', teacher: '', room: '' };
    console.log('getTimeSlotData:', day, timeSlot, data); // Debug log
    return data;
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
          timetableId: null,
          isModified: true,
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

  const activeTab = getActiveTab();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Menu />
        <div style={{ marginLeft: 'var(--menu-width, 288px)' }} className="transition-all duration-300 p-8 min-h-screen font-sans">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-gray-400 mx-auto mb-4" />
              <div className="text-xl text-gray-600">Loading timetable data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Success/Error Messages */}
        {(success || error) && (
          <div className={`mx-4 mb-4 p-4 rounded-lg border ${
            success ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {success ? <FaCheckCircle className="text-lg" /> : <FaExclamationTriangle className="text-lg" />}
              <span className="font-medium">{success || error}</span>
              <button
                onClick={() => { setSuccess(''); setError(''); }}
                className="ml-auto text-current hover:opacity-70"
              >
                <FaTimes />
              </button>
            </div>
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

                  {/* Existing Timetables Button */}
                  <button
                    onClick={() => setShowTimetableModal(true)}
                    className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Browse Existing Timetables"
                  >
                    <FaChevronDown className="text-xs" />
                    <span className="text-sm">Browse</span>
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
                  <input
                    type="text"
                    value={activeTab?.course || ''}
                    onChange={(e) => updateTabField('course', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                  <input
                    type="text"
                    value={activeTab?.branch || ''}
                    onChange={(e) => updateTabField('branch', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="e.g., CSE"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Semester</label>
                  <select
                    value={activeTab?.semester || ''}
                    onChange={(e) => updateTabField('semester', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem.toString()}>Semester {sem}</option>
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
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
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

              {/* Timetable Status Indicator */}
              <div className={`mb-4 p-3 rounded-lg border-l-4 ${
                isTimetableUnlocked(activeTab) 
                  ? 'bg-green-50 border-green-400 text-green-700' 
                  : 'bg-yellow-50 border-yellow-400 text-yellow-700'
              }`}>
                <div className="flex items-center gap-2">
                  {isTimetableUnlocked(activeTab) ? (
                    <>
                      <FaCheck className="text-sm" />
                      <span className="font-medium">Timetable Unlocked</span>
                      <span className="text-sm opacity-80">- You can now edit the timetable</span>
                    </>
                  ) : (
                    <>
                      <FaLock className="text-sm" />
                      <span className="font-medium">Complete Required Fields</span>
                      <span className="text-sm opacity-80">- Fill Course, Branch, Semester & Type to unlock editing</span>
                    </>
                  )}
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
              <div className="flex-1 overflow-auto border border-slate-200 rounded-lg min-h-0 relative">
                {!isTimetableUnlocked(activeTab) && (
                  <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
                      <FaLock className="text-3xl text-slate-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Timetable Locked</h3>
                      <p className="text-sm text-slate-600">
                        Please fill all required fields (Course, Branch, Semester, Type, Batch) to unlock and start editing the timetable.
                      </p>
                    </div>
                  </div>
                )}
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
                          const slotData = getTimeSlotData(day, timeSlot);
                          return (
                            <td key={`${day}-${timeSlot}`} className="p-1 border-r border-slate-200 last:border-r-0">
                              <div className="space-y-0.5">
                                <select
                                  value={slotData.course}
                                  onChange={(e) => updateTimeSlotData(day, timeSlot, 'course', e.target.value)}
                                  disabled={!isTimetableUnlocked(activeTab)}
                                  className={`w-full px-1 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none ${
                                    !isTimetableUnlocked(activeTab) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <option value="">Course</option>
                                  {courses.map(course => (
                                    <option key={course.id} value={course.name}>{course.name}</option>
                                  ))}
                                </select>
                                
                                <select
                                  value={slotData.teacher}
                                  onChange={(e) => updateTimeSlotData(day, timeSlot, 'teacher', e.target.value)}
                                  disabled={!isTimetableUnlocked(activeTab)}
                                  className={`w-full px-1 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none ${
                                    !isTimetableUnlocked(activeTab) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <option value="">Teacher</option>
                                  {teachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
                                  ))}
                                </select>
                                
                                <select
                                  value={slotData.room}
                                  onChange={(e) => updateTimeSlotData(day, timeSlot, 'room', e.target.value)}
                                  disabled={!isTimetableUnlocked(activeTab)}
                                  className={`w-full px-1 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none ${
                                    !isTimetableUnlocked(activeTab) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <option value="">Room</option>
                                  {rooms.map(room => (
                                    <option key={room.id} value={room.name}>{room.name}</option>
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
                <button 
                  onClick={saveTimetable}
                  disabled={saving}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-xs"
                >
                  {saving ? <FaSpinner className="animate-spin text-xs" /> : <FiSave className="text-xs" />}
                  {saving ? 'Saving...' : 'Save Timetable'}
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
                  <span className="font-medium">{stats.totalClasses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Teachers Used:</span>
                  <span className="font-medium">{stats.teachersUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Rooms Used:</span>
                  <span className="font-medium">{stats.roomsUsed}</span>
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

      {/* Timetable Browser Modal */}
      {showTimetableModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FaCalendarAlt className="text-indigo-500" />
                Browse Existing Timetables
              </h3>
              <button
                onClick={() => setShowTimetableModal(false)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <FaTimes className="text-slate-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {timetables.length === 0 ? (
                <div className="text-center py-8">
                  <FaCalendarAlt className="text-4xl text-slate-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-slate-600 mb-2">No Timetables Found</h4>
                  <p className="text-slate-500">Create your first timetable to get started!</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {timetables.map((timetable) => (
                    <button
                      key={timetable.id}
                      onClick={() => openExistingTimetable(timetable)}
                      className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 group-hover:text-indigo-800 mb-1">
                            {timetable.course} - {timetable.branch}
                          </div>
                          <div className="text-sm text-slate-600 flex items-center gap-3">
                            <span>📚 Semester {timetable.semester}</span>
                            <span>⏰ {timetable.type}</span>
                            {timetable.batch && <span>👥 Batch {timetable.batch}</span>}
                          </div>
                          {timetable.createdAt && (
                            <div className="text-xs text-slate-400 mt-1">
                              Created: {new Date(timetable.createdAt.seconds * 1000).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 text-indigo-500 group-hover:text-indigo-700">
                          <FaChevronDown className="rotate-[-90deg]" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowTimetableModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTable;