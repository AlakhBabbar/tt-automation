import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaUpload, 
  FaFileExport, 
  FaSearch,
  FaFilter,
  FaBuilding,
  FaDoorOpen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUsers,
  FaTimes,
  FaSave
} from 'react-icons/fa';
import { FiFileText, FiFilter, FiMapPin, FiHash, FiLayers } from 'react-icons/fi';
import Menu from '../Components/Menu';
import {
  getAllRooms,
  addRoom,
  updateRoom,
  deleteRoom,
  getRoomStatistics,
  exportRoomsToCSV,
  importRoomsFromCSV,
  downloadRoomTemplate
} from '../services/RoomLoad';

const RoomLoad = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [statistics, setStatistics] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterFloor, setFilterFloor] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    faculty: '',
    capacity: '',
    features: '',
    floor: ''
  });

  useEffect(() => {
    loadRooms();
    loadStatistics();
  }, []);

  // Load rooms
  const loadRooms = async () => {
    try {
      const result = await getAllRooms();
      if (result.success) {
        setRooms(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const result = await getRoomStatistics();
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

    // Basic validation - all fields required except features
    if (!formData.name || !formData.code || !formData.faculty || 
        !formData.capacity || !formData.floor) {
      setError('Please fill in all required fields (all fields except Features are required)');
      return;
    }

    try {
      let result;
      if (editingRoom) {
        result = await updateRoom(editingRoom.id, formData);
        if (result.success) {
          setSuccess('Room updated successfully!');
          await loadRooms();
          await loadStatistics();
        } else {
          setError(result.error);
        }
      } else {
        result = await addRoom(formData);
        if (result.success) {
          setSuccess('Room added successfully!');
          await loadRooms();
          await loadStatistics();
        } else {
          setError(result.error);
        }
      }

      if (result.success) {
        resetForm();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const handleEdit = (room) => {
    setFormData({
      name: room.name || '',
      code: room.code || '',
      faculty: room.faculty || '',
      capacity: room.capacity || '',
      features: room.features || '',
      floor: room.floor || ''
    });
    setEditingRoom(room);
    setShowAddForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        const result = await deleteRoom(roomId);
        if (result.success) {
          setSuccess('Room deleted successfully!');
          await loadRooms();
          await loadStatistics();
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to delete room');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await importRoomsFromCSV(file);
      if (result.success) {
        setSuccess(result.data);
        await loadRooms();
        await loadStatistics();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to upload file');
    } finally {
      setLoading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleExport = () => {
    if (filteredRooms.length === 0) {
      setError('No rooms to export');
      return;
    }
    
    exportRoomsToCSV(filteredRooms);
    setSuccess('Rooms exported successfully!');
  };

  const handleDownloadTemplate = () => {
    downloadRoomTemplate();
    setSuccess('Template downloaded successfully!');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      faculty: '',
      capacity: '',
      features: '',
      floor: ''
    });
    setEditingRoom(null);
    setShowAddForm(false);
    setError('');
    setSuccess('');
  };

  // Filter and search logic
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.faculty?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFaculty = !filterFaculty || room.faculty === filterFaculty;
    const matchesFloor = !filterFloor || room.floor?.toString() === filterFloor;
    
    return matchesSearch && matchesFaculty && matchesFloor;
  });

  // Get unique values for filters
  const faculties = [...new Set(rooms.map(room => room.faculty).filter(Boolean))].sort();
  const floors = [...new Set(rooms.map(room => room.floor?.toString()).filter(Boolean))].sort((a, b) => parseInt(a) - parseInt(b));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Menu />
        <div style={{ marginLeft: 'var(--menu-width, 288px)' }} className="transition-all duration-300 p-8 min-h-screen font-sans">
          <div className="flex items-center justify-center h-64">
            <div className="text-xl text-gray-600">Loading rooms...</div>
          </div>
        </div>
      </div>
    );
  }

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
                  <FaDoorOpen className="text-2xl" />
                  Room Management
                </h1>
                <p className="text-lg opacity-90 font-light">
                  Manage room data, capacity, and facility details
                </p>
              </div>
              
              {/* Statistics Cards */}
              {statistics && (
                <div className="flex gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <FaDoorOpen className="text-2xl mx-auto mb-2" />
                    <div className="text-2xl font-bold">{statistics.totalRooms || 0}</div>
                    <div className="text-sm opacity-80">Total Rooms</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <FaBuilding className="text-2xl mx-auto mb-2" />
                    <div className="text-2xl font-bold">{statistics.faculties || 0}</div>
                    <div className="text-sm opacity-80">Faculties</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <FaUsers className="text-2xl mx-auto mb-2" />
                    <div className="text-2xl font-bold">{statistics.totalCapacity || 0}</div>
                    <div className="text-sm opacity-80">Total Capacity</div>
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

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FaPlus />
            Add New Room
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
            disabled={filteredRooms.length === 0}
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
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none w-64"
            />
          </div>
          
          <select
            value={filterFaculty}
            onChange={(e) => setFilterFaculty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
          >
            <option value="">All Faculties</option>
            {faculties.map(faculty => (
              <option key={faculty} value={faculty}>{faculty}</option>
            ))}
          </select>

          <select
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
          >
            <option value="">All Floors</option>
            {floors.map(floor => (
              <option key={floor} value={floor}>Floor {floor}</option>
            ))}
          </select>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FaDoorOpen className="text-slate-600" />
                  {editingRoom ? 'Edit Room' : 'Add New Room'}
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
                        <FaDoorOpen className="inline mr-2" />
                        Room Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        placeholder="e.g., Lecture Hall 1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiHash className="inline mr-2" />
                        Room Code *
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        placeholder="e.g., LH001"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaBuilding className="inline mr-2" />
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
                        <FaUsers className="inline mr-2" />
                        Capacity *
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        placeholder="e.g., 50"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiLayers className="inline mr-2" />
                        Floor *
                      </label>
                      <input
                        type="number"
                        name="floor"
                        value={formData.floor}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        placeholder="e.g., 1"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Fields Section */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <FiFileText className="text-slate-600" />
                    Optional Information
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiMapPin className="inline mr-2" />
                        Features (Equipment and Amenities)
                      </label>
                      <input
                        type="text"
                        name="features"
                        value={formData.features}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        placeholder="e.g., Projector, WiFi, Sound System, Whiteboard"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        List room equipment and amenities separated by commas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
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
                    {editingRoom ? 'Update Room' : 'Add Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rooms Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">
              Rooms ({filteredRooms.length})
            </h2>
          </div>
          
          {filteredRooms.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FaDoorOpen className="text-4xl mx-auto mb-4 opacity-50" />
              <p className="text-lg">No rooms found</p>
              <p className="text-sm">Add some rooms to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-700">Name</th>
                    <th className="text-left p-4 font-medium text-slate-700">Code</th>
                    <th className="text-left p-4 font-medium text-slate-700">Faculty</th>
                    <th className="text-left p-4 font-medium text-slate-700">Capacity</th>
                    <th className="text-left p-4 font-medium text-slate-700">Floor</th>
                    <th className="text-left p-4 font-medium text-slate-700">Features</th>
                    <th className="text-center p-4 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRooms.map(room => (
                    <tr key={room.id} className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">{room.name}</td>
                      <td className="p-4 text-slate-600">{room.code}</td>
                      <td className="p-4 text-slate-600">{room.faculty}</td>
                      <td className="p-4 text-slate-600">{room.capacity}</td>
                      <td className="p-4 text-slate-600">Floor {room.floor}</td>
                      <td className="p-4 text-slate-600 max-w-xs truncate" title={room.features}>
                        {room.features || '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(room)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit room"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(room.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete room"
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

export default RoomLoad;
