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
  FaChevronDown,
  FaRobot,
  FaMagic
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
  getTimetableStatistics,
  TIME_SLOTS,
  WEEKDAYS,
  createEmptyTimetable,
  debugTimetableIntegrity
} from '../services/TimeTable';

// Import Conflict detection functions
import {
  embedConflictsInTimetable,
  extractConflictsForDisplay,
  resolveConflicts,
  isValidTimetableForConflictCheck
} from '../services/Conflicts';

// Import AI service functions
import {
  generateTimetableWithAI,
  prepareAIRequestData,
  validateClassRequests
} from '../services/AIService';

// Import API configuration
import { API_BASE_URL } from '../firebase/firebaseConfig';

// Import PDF export utilities
import { exportSingleTimetableToPDF, exportAllTimetablesToPDF } from '../utils/pdfExport';

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
  
  // Conflict management
  const [tabConflicts, setTabConflicts] = useState({}); // tabId -> conflicts map
  const [dismissedConflicts, setDismissedConflicts] = useState({}); // tabId -> set of dismissed conflict keys
  const [showConflictTooltips, setShowConflictTooltips] = useState(true);
  
  // Tab management
  const [tabs, setTabs] = useState([
    {
      id: 1,
      name: 'New Timetable',
      timetableId: null,
      program: '',
      branch: '',
      semester: '',
      type: '',
      batch: '',
      overallCredits: '',
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

  // AI Generation modal
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiClassRequests, setAiClassRequests] = useState([
    { id: 1, program: '', branch: '', semester: '', batch: '', type: '', credits: '' }
  ]);
  const [includeExistingTimetables, setIncludeExistingTimetables] = useState(false);
  const [selectedExistingTimetables, setSelectedExistingTimetables] = useState([]);
  const [aiGenerating, setAiGenerating] = useState(false);

  // PDF Export modal
  const [showPDFExportModal, setShowPDFExportModal] = useState(false);

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);

  // B.Tech 1st Semester class suggestions
  const classSuggestions = [
    { program: 'B.Tech', branch: 'Computer Science', semester: '1', batch: 'A', type: 'full-time', credits: '24', label: 'B.Tech CS - Sem 1' },
    { program: 'B.Tech', branch: 'Mechanical', semester: '1', batch: 'A', type: 'full-time', credits: '24', label: 'B.Tech ME - Sem 1' },
    { program: 'B.Tech', branch: 'Electrical', semester: '1', batch: 'A', type: 'full-time', credits: '24', label: 'B.Tech EE - Sem 1' },
    { program: 'B.Tech', branch: 'Civil', semester: '1', batch: 'A', type: 'full-time', credits: '24', label: 'B.Tech CE - Sem 1' },
    { program: 'B.Tech', branch: 'Electronics', semester: '1', batch: 'A', type: 'full-time', credits: '24', label: 'B.Tech EC - Sem 1' },
    { program: 'B.Tech', branch: 'Information Technology', semester: '1', batch: 'A', type: 'full-time', credits: '24', label: 'B.Tech IT - Sem 1' },
  ];

  // Temporary data storage for unsaved changes
  const [tempTimetableData, setTempTimetableData] = useState({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load timetable when active tab changes
  useEffect(() => {
    console.log(`🔄 useEffect triggered - activeTabId: ${activeTabId}`);
    const activeTab = getActiveTab();
    console.log(`📋 Active tab:`, activeTab);
    
    if (activeTab) {
      if (activeTab.timetableId) {
        console.log(`📂 Loading existing timetable ID: ${activeTab.timetableId}`);
        loadTimetableForTab(activeTab.timetableId);
      } else {
        // For new tabs, check if we have temporary data
        const tempData = tempTimetableData[activeTab.id];
        console.log(`💾 Checking temp data for tab ${activeTab.id}:`, tempData);
        
        if (tempData) {
          console.log(`✅ Found temp data, setting currentTimetable to:`, tempData);
          setCurrentTimetable(tempData);
          // Calculate stats for temp data
          getTimetableStatistics(tempData).then(statistics => {
            if (statistics.success) {
              setStats(statistics.data);
            }
          });
        } else {
          console.log(`🆕 No temp data, creating empty timetable`);
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
      
      // Check conflicts for the active tab after timetable is loaded
      setTimeout(() => {
        if (activeTab) {
          checkTabConflicts(activeTab.id);
        }
      }, 100); // Small delay to ensure timetable is loaded
    } else {
      console.log(`⚠️ No active tab found`);
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
        
        // Debug timetable integrity
        console.log('=== DEBUGGING TIMETABLE DATA ===');
        debugTimetableIntegrity();
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
    const isUnlocked = tab && tab.program && tab.branch && tab.semester && tab.type;
    return isUnlocked;
  };

  // Conflict management functions
  const checkTabConflicts = async (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !currentTimetable) {
      console.log('checkTabConflicts: Missing tab or currentTimetable', { tab, currentTimetable });
      return;
    }

    // Get unsaved timetables (from other tabs)
    const unsavedTimetables = tabs
      .filter(t => t.id !== tabId && t.timetableId === null)
      .map(t => ({ 
        ...tempTimetableData[t.id] || currentTimetable, 
        id: `tab-${t.id}`, 
        ...t 
      }));

    // Filter out incomplete timetables to prevent false conflicts
    const validSavedTimetables = timetables.filter(isValidTimetableForConflictCheck);

    // Filter out incomplete unsaved timetables
    const validUnsavedTimetables = unsavedTimetables.filter(isValidTimetableForConflictCheck);

    console.log('checkTabConflicts: Checking conflicts for tab', tabId, {
      currentTimetable,
      savedTimetables: timetables.length,
      validSavedTimetables: validSavedTimetables.length,
      unsavedTimetables: unsavedTimetables.length,
      validUnsavedTimetables: validUnsavedTimetables.length
    });

    // Create the timetable to check with current tab data
    const timetableToCheck = { ...currentTimetable, id: `tab-${tabId}`, ...tab };

    // Only check conflicts if the current timetable has basic information
    if (!isValidTimetableForConflictCheck(timetableToCheck)) {
      console.log('checkTabConflicts: Current timetable incomplete, skipping conflict check');
      setTabConflicts(prev => ({
        ...prev,
        [tabId]: {}
      }));
      return;
    }

    // Use the new embedded conflict approach
    const timetableWithConflicts = embedConflictsInTimetable(
      timetableToCheck,
      validSavedTimetables, // filtered saved timetables
      validUnsavedTimetables // filtered unsaved timetables
    );

    // Extract conflicts for display
    const displayConflicts = extractConflictsForDisplay(timetableWithConflicts);

    console.log('checkTabConflicts: Found conflicts', displayConflicts);

    setTabConflicts(prev => ({
      ...prev,
      [tabId]: displayConflicts
    }));

    // If this is the active tab, update the conflicts state immediately
    if (tabId === activeTabId) {
      const allConflicts = [];
      Object.keys(displayConflicts).forEach(day => {
        Object.keys(displayConflicts[day]).forEach(timeSlot => {
          const slotConflicts = displayConflicts[day][timeSlot] || [];
          slotConflicts.forEach(conflict => {
            allConflicts.push({ ...conflict, day, timeSlot });
          });
        });
      });
      setConflicts(allConflicts);
    }
  };

  const getSlotConflicts = (day, timeSlot) => {
    const activeTab = getActiveTab();
    if (!activeTab) return [];

    const tabConflictsForTab = tabConflicts[activeTab.id];
    if (!tabConflictsForTab || !tabConflictsForTab[day] || !tabConflictsForTab[day][timeSlot]) {
      return [];
    }

    return tabConflictsForTab[day][timeSlot];
  };

  const getAllConflictsForActiveTab = () => {
    const activeTab = getActiveTab();
    if (!activeTab) return [];

    const tabConflictsForTab = tabConflicts[activeTab.id];
    if (!tabConflictsForTab) return [];

    const allConflicts = [];
    Object.keys(tabConflictsForTab).forEach(day => {
      Object.keys(tabConflictsForTab[day]).forEach(timeSlot => {
        const slotConflicts = tabConflictsForTab[day][timeSlot] || [];
        slotConflicts.forEach(conflict => {
          if (!isConflictDismissed(conflict, day, timeSlot)) {
            allConflicts.push({ ...conflict, day, timeSlot });
          }
        });
      });
    });

    return allConflicts;
  };

  const hasSlotConflicts = (day, timeSlot) => {
    return getSlotConflicts(day, timeSlot).length > 0;
  };

  const getConflictKey = (conflict, day, timeSlot) => {
    return `${day}-${timeSlot}-${conflict.type}-${conflict.program}-${conflict.branch}-${conflict.semester}`;
  };

  const isConflictDismissed = (conflict, day, timeSlot) => {
    const activeTab = getActiveTab();
    if (!activeTab) return false;

    const dismissedForTab = dismissedConflicts[activeTab.id] || new Set();
    const conflictKey = getConflictKey(conflict, day, timeSlot);
    return dismissedForTab.has(conflictKey);
  };

  const dismissConflict = (conflict, day, timeSlot) => {
    const activeTab = getActiveTab();
    if (!activeTab) return;

    const conflictKey = getConflictKey(conflict, day, timeSlot);
    setDismissedConflicts(prev => {
      const dismissedForTab = prev[activeTab.id] || new Set();
      const newDismissedForTab = new Set(dismissedForTab);
      newDismissedForTab.add(conflictKey);
      
      return {
        ...prev,
        [activeTab.id]: newDismissedForTab
      };
    });
  };

  const switchToTab = (tabId) => {
    setActiveTabId(tabId);
    
    // Reset conflicts state to show only conflicts for the new active tab
    setConflicts([]);
    
    // Check conflicts for the newly active tab
    const tab = tabs.find(t => t.id === tabId);
    if (tab && currentTimetable) {
      setTimeout(() => {
        checkTabConflicts(tabId);
        // Update the conflicts state with the new tab's conflicts
        setTimeout(() => {
          const newTabConflicts = getAllConflictsForActiveTab();
          setConflicts(newTabConflicts);
        }, 50);
      }, 100);
    }
  };

  // AI Generation Helper Functions
  const updateClassRequest = (index, field, value) => {
    const updatedRequests = [...aiClassRequests];
    updatedRequests[index] = { ...updatedRequests[index], [field]: value };
    setAiClassRequests(updatedRequests);
  };

  const addClassRequest = () => {
    setAiClassRequests([...aiClassRequests, {
      program: '',
      branch: '',
      semester: '',
      batch: '',
      type: '',
      credits: ''
    }]);
  };

  const removeClassRequest = (index) => {
    if (aiClassRequests.length > 1) {
      const updatedRequests = aiClassRequests.filter((_, i) => i !== index);
      setAiClassRequests(updatedRequests);
    }
  };

  // Process AI-generated timetables and create tabs automatically
  const processGeneratedTimetables = async (generatedTimetables) => {
    console.log('🔄 Processing generated timetables:', generatedTimetables.length);
    
    // Check if the first tab is empty and should be removed
    const isFirstTabEmpty = tabs.length === 1 && 
      tabs[0].id === 1 && 
      !tabs[0].program && 
      !tabs[0].branch && 
      !tabs[0].semester && 
      !tabs[0].type && 
      !tabs[0].timetableId;
    
    // If first tab is empty, clear tabs array to start fresh
    if (isFirstTabEmpty) {
      setTabs([]);
    }
    
    for (let i = 0; i < generatedTimetables.length; i++) {
      const timetableData = generatedTimetables[i];
      console.log(`📋 Processing timetable ${i + 1}:`, timetableData);
      
      const timetable = timetableData.timetable;
      
      if (!timetable) {
        console.warn('⚠️ Skipping timetable without structure:', timetableData);
        continue;
      }
      
      console.log('🏗️ Processing room IDs in timetable...');
      // Convert room IDs to room names for better display
      const processedTimetable = await processRoomIdsInTimetable(timetable);
      console.log('✅ Room IDs processed');
      
      // Generate tab name from timetable metadata
      const tabName = generateTabName(
        processedTimetable.program,
        processedTimetable.branch,
        processedTimetable.semester,
        processedTimetable.type,
        processedTimetable.batch
      );
      
      // Create new tab for this timetable
      const newTab = {
        id: nextTabId + i,
        name: tabName,
        timetableId: null, // This is a new unsaved timetable
        program: processedTimetable.program || '',
        branch: processedTimetable.branch || '',
        semester: processedTimetable.semester || '',
        type: processedTimetable.type || '',
        batch: processedTimetable.batch || '',
        overallCredits: processedTimetable.overallCredits || '',
        isActive: false,
        isModified: true // Mark as modified since it has AI-generated content
      };
      
      console.log(`📋 Creating tab ${i + 1}: ${tabName}`);
      console.log(`🏷️ New tab data:`, newTab);
      
      // Add the tab
      setTabs(prevTabs => {
        const updatedTabs = [...prevTabs, newTab];
        console.log('📑 Updated tabs:', updatedTabs.map(t => ({ id: t.id, name: t.name })));
        return updatedTabs;
      });
      
      // Store the timetable data temporarily (since it's not saved yet)
      setTempTimetableData(prevData => {
        const updatedData = {
          ...prevData,
          [newTab.id]: processedTimetable
        };
        console.log(`💾 Stored timetable data for tab ${newTab.id}`);
        return updatedData;
      });
      
      // If this is the first generated timetable, switch to its tab
      if (i === 0) {
        console.log(`🔄 Switching to tab ${newTab.id}`);
        setActiveTabId(newTab.id);
        setCurrentTimetable(processedTimetable);
        
        // Calculate stats for the new timetable
        try {
          const statistics = await getTimetableStatistics(processedTimetable);
          if (statistics.success) {
            setStats(statistics.data);
          }
        } catch (error) {
          console.warn('Could not calculate stats for generated timetable:', error);
        }
        
        // Check conflicts for the new timetable after a short delay
        setTimeout(() => {
          checkTabConflicts(newTab.id);
        }, 500);
      }
    }
    
    // Update nextTabId for future tabs
    setNextTabId(prevId => prevId + generatedTimetables.length);
    
    console.log('✅ All timetable tabs created successfully');
  };

  // Convert room IDs to room names in timetable data
  const processRoomIdsInTimetable = (timetable) => {  // Remove async since we don't need it
    console.log('🔧 Processing room IDs in timetable...');
    console.log('🏗️ Input timetable:', timetable);
    console.log('🏢 Available rooms:', rooms);
    
    const processedTimetable = { ...timetable };
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (const day of days) {
      if (processedTimetable[day]) {
        console.log(`📅 Processing ${day}:`, processedTimetable[day]);
        
        for (const timeSlot of Object.keys(processedTimetable[day])) {
          const slot = processedTimetable[day][timeSlot];
          if (slot && slot.room) {
            console.log(`🕐 Processing ${timeSlot} - Original room:`, slot.room);
            
            // Find room name by ID
            const room = rooms.find(r => r.id === slot.room);
            if (room) {
              console.log(`✅ Found room: ${room.name} for ID: ${slot.room}`);
              processedTimetable[day][timeSlot] = {
                ...slot,
                room: room.name
              };
            } else {
              console.log(`⚠️ Room not found for ID: ${slot.room}, keeping original`);
              // If room not found, keep the original ID (fallback)
            }
          }
        }
      }
    }
    
    console.log('✅ Processed timetable:', processedTimetable);
    return processedTimetable;
  };

  const handleGenerateWithAI = async () => {
    // Close modal immediately when button is pressed
    setShowAIModal(false);
    
    setAiGenerating(true);
    setError(''); // Clear any previous errors
    
    try {
      console.log('🚀 Starting AI timetable generation...');
      console.log('🔗 Backend URL being used:', API_BASE_URL);
      
      // Test backend connection first
      try {
        console.log('🔍 Testing backend connection...');
        const testResponse = await fetch(`${API_BASE_URL}/api/timetable/health`);
        console.log('📡 Test response status:', testResponse.status);
        if (testResponse.ok) {
          const testText = await testResponse.text();
          console.log('✅ Backend is running:', testText);
          setSuccess('✅ Backend connection successful!');
        } else {
          console.error('❌ Backend test failed with status:', testResponse.status);
          setError(`Backend not responding (status: ${testResponse.status})`);
          return;
        }
      } catch (testError) {
        console.error('❌ Backend connection test failed:', testError);
        setError(`Cannot connect to backend: ${testError.message}. Make sure Express server is running on port 3000.`);
        return;
      }
      
      // Step 1: Validate user input
      const validation = validateClassRequests(aiClassRequests);
      if (!validation.isValid) {
        setError(`Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      console.log('📊 Gathering data for AI generation...');
      
      // Step 2: Prepare complete data package
      const requestData = prepareAIRequestData(
        aiClassRequests,
        selectedExistingTimetables,
        timetables,
        courses,
        teachers,
        rooms
      );

      console.log(`✅ Data prepared - Classes: ${requestData.classRequests.length}, Teachers: ${requestData.teachers.length}, Rooms: ${requestData.rooms.length}`);

      // Step 3: Show connection attempt
      setSuccess('🌐 Connecting to AI service...');
      
      // Step 4: Send to backend AI service
      console.log('🌐 Sending request to backend...');
      const result = await generateTimetableWithAI(requestData);
      
      if (result.success) {
        console.log('✅ AI generation successful');
        
        
        console.log("result.data: ", result.data)
        console.log("result.data.data.timetables: ", result.data.data.timetables)
        console.log("result.data.data.timetables.length: ", result.data.data.timetables.length)
        // Check if we got structured timetables from Express backend
        if (result.data && result.data.data && result.data.data.timetables && result.data.data.timetables.length > 0) {
          console.log(`🎓 AI generated ${result.data.data.timetables.length} timetable(s)`);
          console.log('📋 Timetables data:', result.data.data.timetables);
          
          // Process each generated timetable and create tabs (following openExistingTimetable pattern)
          for (let index = 0; index < result.data.data.timetables.length; index++) {
            const generatedTimetable = result.data.data.timetables[index];
            const timetableData = generatedTimetable.timetable;

            console.log(`🔄 Processing timetable ${index + 1}:`, timetableData);
            
            // Process room IDs to names
            const processedTimetable = processRoomIdsInTimetable(timetableData);

            console.log(`✅ Processed timetable ${index + 1}:`, processedTimetable);
            
            console.log(`🏗️ Creating tab ${index + 1} for:`, {
              program: processedTimetable.program,
              branch: processedTimetable.branch,
              semester: processedTimetable.semester,
              type: processedTimetable.type,
              batch: processedTimetable.batch
            });
            
            // Create new tab for this AI-generated timetable (exact same logic as openExistingTimetable)
            const newTab = {
              id: nextTabId + index,
              name: generateTabName(processedTimetable.program, processedTimetable.branch, processedTimetable.semester, processedTimetable.type, processedTimetable.batch),
              timetableId: null, // AI-generated timetables don't have saved IDs yet
              program: processedTimetable.program,
              branch: processedTimetable.branch,
              semester: processedTimetable.semester,
              type: processedTimetable.type,
              batch: processedTimetable.batch || '',
              overallCredits: processedTimetable.overallCredits || '',
              isActive: false,
              isModified: true // Mark as modified since it's not saved yet
            };
            
            console.log(`📝 Created new tab for timetable ${index + 1}:`, newTab);
            
            // Add tab to the list
            setTabs(prevTabs => {
              const updatedTabs = [...prevTabs, newTab];
              console.log(`📋 Updated tabs (after adding ${index + 1}):`, updatedTabs.map(t => ({ id: t.id, name: t.name })));
              return updatedTabs;
            });
            
            // CRITICAL: Store timetable data BEFORE setting active tab to ensure useEffect can find it
            console.log(`� Storing timetable data for tab ${nextTabId + index} BEFORE activating tab`);
            setTempTimetableData(prev => {
              const updated = {
                ...prev,
                [nextTabId + index]: processedTimetable
              };
              console.log(`� Updated temp data:`, updated);
              return updated;
            });
            
            // Store timetable data for ALL tabs to ensure they can be accessed
            setTempTimetableData(prev => ({
              ...prev,
              [nextTabId + index]: processedTimetable
            }));
          }
          
          // After ALL tabs and data are set, switch to the first generated timetable
          setTimeout(() => {
            setActiveTabId(nextTabId);
          }, 200);
          
          // Update next tab ID for future tabs
          setNextTabId(nextTabId + result.data.data.timetables.length);
          
          setSuccess(`🎉 Successfully generated ${result.data.data.timetables.length} timetable(s) and created ${result.data.data.timetables.length} new tab(s)!`);
          
        } else {
          // Handle cases where response format is different
          console.log('🤖 AI Response received:', result.data);
          setSuccess(`🎉 AI Response Generated! Please check the response format if its not getting displayed`);
        }
        
        // Show success message for a bit longer
        setTimeout(() => {
          setSuccess('🤖 AI timetable generation completed! Check the new tabs for visualized timetables.');
        }, 5000);
        
      } else {
        console.error('❌ AI generation failed:', result.error);
        
        // Check if it's a connection error
        if (result.error.includes('fetch') || result.error.includes('network') || result.error.includes('connection')) {
          setError(`🔌 Backend connection failed: ${result.error}. Please ensure the Express server is running on port 3000.`);
        } else {
          setError(`AI generation failed: ${result.error}`);
        }
      }
      
    } catch (error) {
      console.error('💥 Unexpected error in AI generation:', error);
      
      // Provide specific error messages based on error type
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('🔌 Cannot connect to backend. Please start the Express server first:\n1. Open terminal\n2. cd backend-local\n3. npm start');
      } else {
        setError(`Unexpected error: ${error.message}`);
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const getVisibleConflicts = (day, timeSlot) => {
    const conflicts = getSlotConflicts(day, timeSlot);
    return conflicts.filter(conflict => !isConflictDismissed(conflict, day, timeSlot));
  };

  const generateTabName = (program, branch, semester, type, batch) => {
    if (!program || !branch || !semester || !type) {
      return 'New Timetable';
    }
    const batchSuffix = batch ? `-${batch}` : '';
    return `${program}-${branch}-Sem${semester}-${type === 'full-time' ? 'FT' : 'PT'}${batchSuffix}`;
  };

  const addNewTab = () => {
    const newTab = {
      id: nextTabId,
      name: `New Timetable ${nextTabId}`,
      timetableId: null,
      program: '',
      branch: '',
      semester: '',
      type: '',
      batch: '',
      overallCredits: '',
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
      name: generateTabName(timetable.program, timetable.branch, timetable.semester, timetable.type, timetable.batch),
      timetableId: timetable.id,
      program: timetable.program,
      branch: timetable.branch,
      semester: timetable.semester,
      type: timetable.type,
      batch: timetable.batch || '',
      overallCredits: timetable.overallCredits || '',
      isActive: false,
      isModified: false
    };
    
    // Check if the first tab is empty and remove it
    const isFirstTabEmpty = tabs.length === 1 && 
      tabs[0].id === 1 && 
      !tabs[0].program && 
      !tabs[0].branch && 
      !tabs[0].semester && 
      !tabs[0].type && 
      !tabs[0].timetableId;
    
    if (isFirstTabEmpty) {
      setTabs([newTab]);
    } else {
      setTabs([...tabs, newTab]);
    }
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
    
    // Check conflicts for the loaded timetable
    setTimeout(() => {
      checkTabConflicts(nextTabId);
    }, 100); // Small delay to ensure tab is properly set up
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
          updatedTab.program,
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
    if (activeTab && activeTab.program && activeTab.branch && activeTab.semester && activeTab.type) {
      checkForExistingTimetable(activeTab);
    }
  };

  const checkForExistingTimetable = async (tab) => {
    try {
      // Only check if this is a new timetable (no timetableId)
      if (tab.timetableId) return;
      
      const result = await findTimetableByFields(
        tab.program,
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
        
        setSuccess(`Found and loaded existing timetable: ${existingTimetable.program} ${existingTimetable.branch}`);
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

  const handleSaveClick = () => {
    console.log('Save button clicked');
    console.log('Current timetable:', currentTimetable);
    console.log('Active tab:', getActiveTab());
    console.log('All tabs:', tabs);
    
    // Check if there are multiple modified tabs
    const modifiedTabs = tabs.filter(tab => tab.isModified || !tab.timetableId);
    console.log('Modified tabs:', modifiedTabs);
    console.log('Modified tabs count:', modifiedTabs.length);
    
    if (modifiedTabs.length > 1) {
      // Show modal to ask user
      console.log('Showing save modal for multiple tabs');
      console.log('Setting showSaveModal to true');
      setShowSaveModal(true);
      console.log('showSaveModal should be true now');
    } else {
      // Save only current timetable
      console.log('Saving current timetable directly');
      saveCurrentTimetable();
    }
  };

  const saveCurrentTimetable = async () => {
    setShowSaveModal(false);
    const activeTab = getActiveTab();
    if (!activeTab) {
      console.error('No active tab found');
      return;
    }

    if (!activeTab.program || !activeTab.branch || !activeTab.semester || !activeTab.type) {
      setError('Please fill all required fields (Program, Branch, Semester, Type)');
      return;
    }

    if (!currentTimetable) {
      console.error('No current timetable data found');
      setError('No timetable data to save');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Create clean timetable data structure
      const timetableData = {
        program: activeTab.program,
        branch: activeTab.branch,
        semester: activeTab.semester,
        type: activeTab.type
      };

      // Only include batch if it exists
      if (activeTab.batch) {
        timetableData.batch = activeTab.batch;
      }

      // Only include overallCredits if it exists
      if (activeTab.overallCredits) {
        timetableData.overallCredits = activeTab.overallCredits;
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
        setError(result.error || 'Failed to save timetable');
      }
    } catch (err) {
      console.error('Error saving timetable:', err);
      setError(`Failed to save timetable: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveAllOpenedTimetables = async () => {
    setShowSaveModal(false);
    setSaving(true);
    setError('');
    setSuccess('');

    let savedCount = 0;
    let errorCount = 0;

    try {
      for (const tab of tabs) {
        // Skip tabs without required fields
        if (!tab.program || !tab.branch || !tab.semester || !tab.type) {
          continue;
        }

        // Get timetable data for this tab
        const timetableData = {
          program: tab.program,
          branch: tab.branch,
          semester: tab.semester,
          type: tab.type
        };

        if (tab.batch) {
          timetableData.batch = tab.batch;
        }

        if (tab.overallCredits) {
          timetableData.overallCredits = tab.overallCredits;
        }

        // Get the timetable content for this tab
        const tabTimetable = tab.timetableId 
          ? timetables.find(tt => tt.id === tab.timetableId)
          : tempTimetableData[tab.id] || currentTimetable;

        if (tabTimetable) {
          // Add schedule data
          WEEKDAYS.forEach(day => {
            if (tabTimetable[day]) {
              const daySchedule = {};
              Object.keys(tabTimetable[day]).forEach(timeSlot => {
                const slot = tabTimetable[day][timeSlot];
                if (slot && (slot.course || slot.teacher || slot.room)) {
                  daySchedule[timeSlot] = {
                    course: slot.course || '',
                    teacher: slot.teacher || '',
                    room: slot.room || ''
                  };
                }
              });
              if (Object.keys(daySchedule).length > 0) {
                timetableData[day] = daySchedule;
              }
            }
          });

          // Save or update
          let result;
          if (tab.timetableId) {
            result = await updateTimetable(tab.timetableId, timetableData);
          } else {
            result = await addTimetable(timetableData);
          }

          if (result.success) {
            savedCount++;
            // Update tab to mark as saved
            const updatedTabs = tabs.map(t => {
              if (t.id === tab.id) {
                return {
                  ...t,
                  timetableId: result.data.id,
                  isModified: false
                };
              }
              return t;
            });
            setTabs(updatedTabs);
          } else {
            errorCount++;
          }
        }
      }

      // Reload data
      await loadInitialData();

      if (savedCount > 0) {
        setSuccess(`Successfully saved ${savedCount} timetable(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}!`);
      } else {
        setError('No timetables were saved. Please check required fields.');
      }
    } catch (err) {
      setError('Failed to save timetables');
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
    
    // Real-time conflict detection using new conflict system
    if (updatedTimetable[dayKey][timeSlot].teacher || updatedTimetable[dayKey][timeSlot].room) {
      checkTabConflicts(activeTab.id);
    }
  };

  const getTimeSlotData = (day, timeSlot) => {
    if (!currentTimetable) {
      console.log(`⚠️ getTimeSlotData: currentTimetable is null/undefined for ${day} ${timeSlot}`);
      return { course: '', teacher: '', room: '' };
    }
    
    const dayKey = day.toLowerCase();
    const data = currentTimetable[dayKey]?.[timeSlot] || { course: '', teacher: '', room: '' };
    
    // Only log when there's actual data to avoid spam
    if (data.course || data.teacher || data.room) {
      console.log(`📅 getTimeSlotData(${day}, ${timeSlot}):`, data);
      console.log(`📊 currentTimetable[${dayKey}][${timeSlot}]:`, currentTimetable[dayKey]?.[timeSlot]);
    }
    
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
            activeTab.program,
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

  const handleExportToPDF = () => {
    setShowPDFExportModal(true);
  };

  const exportCurrentTimetableToPDF = () => {
    const activeTab = getActiveTab();
    if (!activeTab || !currentTimetable) {
      alert('No timetable to export');
      return;
    }

    if (!activeTab.program || !activeTab.branch || !activeTab.semester) {
      alert('Please fill in required fields (Program, Branch, Semester) before exporting');
      return;
    }

    const timetableData = {
      ...currentTimetable,
      program: activeTab.program,
      branch: activeTab.branch,
      semester: activeTab.semester,
      type: activeTab.type,
      batch: activeTab.batch
    };

    exportSingleTimetableToPDF(timetableData);
    setShowPDFExportModal(false);
    setSuccess('PDF exported successfully!');
  };

  const exportAllTimetablesPDF = () => {
    if (timetables.length === 0) {
      alert('No saved timetables to export');
      return;
    }

    exportAllTimetablesToPDF(timetables);
    setShowPDFExportModal(false);
    setSuccess(`All ${timetables.length} timetable(s) exported successfully!`);
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
            
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setShowAIModal(true)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                title="Generate timetable using AI"
              >
                <FaRobot className="text-sm" />
                Generate with AI
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="Toggle Fullscreen"
              >
                <FaExpand className="text-lg" />
              </button>
            </div>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIModal(true)}
              className="px-3 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              title="Generate timetable using AI"
            >
              <FaRobot className="text-sm" />
              Generate with AI
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Exit Fullscreen"
            >
              <FaCompress className="text-lg" />
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
                      onClick={() => switchToTab(tab.id)}
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Program</label>
                  <input
                    type="text"
                    value={activeTab?.program || ''}
                    onChange={(e) => updateTabField('program', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="e.g., BTech, BSc, MSc"
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Overall Credits</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={activeTab?.overallCredits || ''}
                    onChange={(e) => updateTabField('overallCredits', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="e.g., 37.5, 40"
                  />
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
                          const hasConflict = hasSlotConflicts(day, timeSlot);
                          const conflicts = getVisibleConflicts(day, timeSlot);
                          
                          return (
                            <td key={`${day}-${timeSlot}`} className={`p-1 border-r border-slate-200 last:border-r-0 relative ${
                              hasConflict ? 'border-2 border-red-500 bg-red-50' : ''
                            }`}>
                              <div className="space-y-0.5"
                                   title={hasConflict ? 
                                     conflicts.map(c => c.message).join('; ') : 
                                     ''
                                   }
                              >
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
                                
                                {/* Conflict Display */}
                                {hasConflict && conflicts.length > 0 && (
                                  <div className="mt-1">
                                    {conflicts.map((conflict, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between bg-red-100 border border-red-300 rounded px-1 py-0.5 text-xs mb-0.5"
                                        title={`${conflict.type} conflict with ${conflict.program}-${conflict.branch}-Sem${conflict.semester}`}
                                      >
                                        <span className="text-red-700 truncate text-xs">
                                          {conflict.type === 'teacher' ? '👨‍🏫' : '🏫'} {conflict.type}
                                        </span>
                                        <button
                                          onClick={() => dismissConflict(conflict, day, timeSlot)}
                                          className="text-red-500 hover:text-red-700 ml-1 flex-shrink-0"
                                          title="Dismiss this conflict warning"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
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
                  onClick={handleSaveClick}
                  disabled={saving}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-xs"
                >
                  {saving ? <FaSpinner className="animate-spin text-xs" /> : <FiSave className="text-xs" />}
                  {saving ? 'Saving...' : 'Save Timetable'}
                </button>
                <button 
                  onClick={handleExportToPDF}
                  className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 text-xs"
                >
                  <FiDownload className="text-xs" />
                  Export PDF
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
              {(() => {
                const activeTab = getActiveTab();
                if (!activeTab) return null;
                
                const tabConflictsForTab = tabConflicts[activeTab.id] || {};
                const allConflicts = [];
                
                // Collect all conflicts from the current tab
                WEEKDAYS.forEach(day => {
                  if (tabConflictsForTab[day]) {
                    TIME_SLOTS.forEach(timeSlot => {
                      const slotConflicts = tabConflictsForTab[day][timeSlot] || [];
                      slotConflicts.forEach(conflict => {
                        if (!isConflictDismissed(conflict, day, timeSlot)) {
                          allConflicts.push({
                            ...conflict,
                            day,
                            timeSlot,
                            location: `${day.charAt(0).toUpperCase() + day.slice(1)} ${timeSlot}`
                          });
                        }
                      });
                    });
                  }
                });
                
                if (allConflicts.length === 0) {
                  return (
                    <div className="text-center py-4">
                      <FaCheck className="text-xl text-green-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-600">No conflicts detected</p>
                    </div>
                  );
                }
                
                return allConflicts.map((conflict, index) => (
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
                ));
              })()}
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
                            {timetable.program} - {timetable.branch}
                          </div>
                          <div className="text-sm text-slate-600 flex items-center gap-3">
                            <span>Semester {timetable.semester}</span>
                            <span>•</span>
                            <span>{timetable.type}</span>
                            {timetable.batch && (
                              <>
                                <span>•</span>
                                <span>Batch {timetable.batch}</span>
                              </>
                            )}
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

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            {/* Header */}
            <div className="bg-slate-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <FiSave className="text-white text-xl" />
                <h2 className="text-xl font-semibold text-white">Save Timetable</h2>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-white/80 hover:text-white"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">Choose what you want to save:</p>
              
              <div className="space-y-3">
                {/* Current Timetable Option */}
                <button
                  onClick={saveCurrentTimetable}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-slate-500 hover:bg-slate-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 group-hover:bg-slate-200 p-3 rounded-lg transition-colors">
                      <FaCalendarAlt className="text-slate-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-slate-700">Current Timetable</h3>
                      <p className="text-sm text-gray-600">Save only the active/opened timetable</p>
                      {activeTab && activeTab.program && (
                        <p className="text-xs text-gray-500 mt-1">
                          {activeTab.program} - {activeTab.branch} - Sem {activeTab.semester}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                {/* All Opened Timetables Option */}
                <button
                  onClick={saveAllOpenedTimetables}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-slate-500 hover:bg-slate-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 group-hover:bg-indigo-200 p-3 rounded-lg transition-colors">
                      <FaCopy className="text-indigo-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-indigo-700">All Opened Timetables</h3>
                      <p className="text-sm text-gray-600">Save all timetables currently in tabs</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {tabs.length} tab(s) opened
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end rounded-b-xl">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      {showPDFExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            {/* Header */}
            <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <FiDownload className="text-white text-xl" />
                <h2 className="text-xl font-semibold text-white">Export to PDF</h2>
              </div>
              <button
                onClick={() => setShowPDFExportModal(false)}
                className="text-white/80 hover:text-white"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">Choose what you want to export:</p>
              
              <div className="space-y-3">
                {/* Current Timetable Option */}
                <button
                  onClick={exportCurrentTimetableToPDF}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 group-hover:bg-emerald-200 p-3 rounded-lg transition-colors">
                      <FaCalendarAlt className="text-emerald-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-emerald-700">Current Timetable</h3>
                      <p className="text-sm text-gray-600">Export only the opened timetable</p>
                      {activeTab && (
                        <p className="text-xs text-gray-500 mt-1">
                          {activeTab.program} - {activeTab.branch} - Sem {activeTab.semester}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                {/* All Timetables Option */}
                <button
                  onClick={exportAllTimetablesPDF}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                  disabled={timetables.length === 0}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 group-hover:bg-indigo-200 p-3 rounded-lg transition-colors">
                      <FaCopy className="text-indigo-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-indigo-700">All Timetables</h3>
                      <p className="text-sm text-gray-600">Export all saved timetables in one PDF</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {timetables.length} timetable(s) available
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end rounded-b-xl">
              <button
                onClick={() => setShowPDFExportModal(false)}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaRobot className="text-white text-xl" />
                <h2 className="text-xl font-semibold text-white">Generate with AI</h2>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="text-white/80 hover:text-white"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="space-y-5">
                {/* Quick Suggestions */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaMagic className="text-indigo-600 text-sm" />
                    <h3 className="text-sm font-semibold text-gray-700">Quick Add (B.Tech Sem 1)</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {classSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const newRequest = {
                            id: Date.now(),
                            program: suggestion.program,
                            branch: suggestion.branch,
                            semester: suggestion.semester,
                            batch: suggestion.batch,
                            type: suggestion.type,
                            credits: suggestion.credits
                          };
                          
                          // Remove the initial empty row if it exists
                          const isFirstRowEmpty = aiClassRequests.length === 1 && 
                            !aiClassRequests[0].program && 
                            !aiClassRequests[0].branch && 
                            !aiClassRequests[0].semester && 
                            !aiClassRequests[0].batch && 
                            !aiClassRequests[0].type && 
                            !aiClassRequests[0].credits;
                          
                          if (isFirstRowEmpty) {
                            setAiClassRequests([newRequest]);
                          } else {
                            setAiClassRequests([...aiClassRequests, newRequest]);
                          }
                        }}
                        className="px-3 py-2 bg-gray-100 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        {suggestion.branch}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Class Requests */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Classes ({aiClassRequests.length})</h3>
                  </div>
                  
                  {/* Class Request Rows */}
                  <div className="space-y-2">
                    {aiClassRequests.map((request, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                          <input
                            type="text"
                            placeholder="Program"
                            value={request.program}
                            onChange={(e) => updateClassRequest(index, 'program', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Branch"
                            value={request.branch}
                            onChange={(e) => updateClassRequest(index, 'branch', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Sem"
                            value={request.semester}
                            onChange={(e) => updateClassRequest(index, 'semester', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Batch"
                            value={request.batch}
                            onChange={(e) => updateClassRequest(index, 'batch', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                          <select
                            value={request.type}
                            onChange={(e) => updateClassRequest(index, 'type', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                          >
                            <option value="">Type</option>
                            <option value="full-time">Full</option>
                            <option value="part-time">Part</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Credits"
                            value={request.credits}
                            onChange={(e) => updateClassRequest(index, 'credits', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            min="1"
                            max="200"
                          />
                          <button
                            onClick={() => removeClassRequest(index)}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            disabled={aiClassRequests.length === 1}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={addClassRequest}
                    className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FaPlus />
                    Add Class
                  </button>
                </div>

                {/* Existing Timetables Option */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeExistingTimetables}
                      onChange={(e) => setIncludeExistingTimetables(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    Include existing timetables
                  </label>

                  {includeExistingTimetables && (
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {timetables.length === 0 ? (
                        <p className="text-xs text-gray-500 py-4 text-center">No existing timetables</p>
                      ) : (
                        timetables.map((timetable) => (
                          <label 
                            key={timetable.id} 
                            className="flex items-start gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer border border-gray-200"
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedExistingTimetables.includes(timetable.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExistingTimetables([...selectedExistingTimetables, timetable.id]);
                                } else {
                                  setSelectedExistingTimetables(selectedExistingTimetables.filter(id => id !== timetable.id));
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">
                                {timetable.program} - {timetable.branch}
                              </div>
                              <div className="flex gap-2 mt-1 text-xs text-gray-600">
                                <span>Sem {timetable.semester}</span>
                                <span>•</span>
                                <span className="capitalize">{timetable.type}</span>
                                {timetable.batch && (
                                  <>
                                    <span>•</span>
                                    <span>Batch {timetable.batch}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {aiClassRequests.length} class{aiClassRequests.length !== 1 ? 'es' : ''} ready
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateWithAI}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <FaRobot />
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Loader */}
      {aiGenerating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              {/* Outer spinning ring */}
              <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
              {/* Inner pulsing dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Generating Timetables</h3>
            <p className="text-sm text-gray-500">AI is creating your timetables...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTable;