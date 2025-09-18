import React, { useState, useEffect } from 'react';
import { 
  FaBuilding,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaSave,
  FaClock,
  FaUsers,
  FaCheck
} from 'react-icons/fa';
import {
  getAllRooms,
  updateRoom
} from '../services/RoomLoad';

// Define time slots and weekdays for availability grid
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-1:00', '1:00-2:00', '2:00-3:00', '3:00-4:00', '4:00-5:00'
];

const RoomAvailability = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomAvailability, setRoomAvailability] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  // Initialize room availability with empty grid
  const initializeRoomAvailability = (roomId) => {
    const availability = {};
    WEEKDAYS.forEach(day => {
      availability[day] = {};
      TIME_SLOTS.forEach(slot => {
        availability[day][slot] = false;
      });
    });
    return availability;
  };

  // Load rooms from Firebase
  const loadRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllRooms();
      if (result.success) {
        setRooms(result.data);
        
        // Initialize availability for all rooms
        const initialAvailability = {};
        result.data.forEach(room => {
          if (room.availability) {
            initialAvailability[room.id] = room.availability;
          } else {
            initialAvailability[room.id] = initializeRoomAvailability(room.id);
          }
        });
        setRoomAvailability(initialAvailability);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  // Handle room selection
  const handleRoomSelection = (room) => {
    setSelectedRoom(room);
    if (!roomAvailability[room.id]) {
      setRoomAvailability(prev => ({
        ...prev,
        [room.id]: initializeRoomAvailability(room.id)
      }));
    }
  };

  // Handle individual checkbox change
  const handleAvailabilityChange = (roomId, day, slot) => {
    setRoomAvailability(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [day]: {
          ...prev[roomId][day],
          [slot]: !prev[roomId][day][slot]
        }
      }
    }));
  };

  // Select all time slots for a specific day
  const handleSelectAllDay = (roomId, day) => {
    const allSelected = TIME_SLOTS.every(slot => roomAvailability[roomId]?.[day]?.[slot]);
    setRoomAvailability(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [day]: TIME_SLOTS.reduce((acc, slot) => {
          acc[slot] = !allSelected;
          return acc;
        }, {})
      }
    }));
  };

  // Select all time slots for entire grid
  const handleSelectAllGrid = (roomId) => {
    const allSelected = WEEKDAYS.every(day => 
      TIME_SLOTS.every(slot => roomAvailability[roomId]?.[day]?.[slot])
    );
    setRoomAvailability(prev => ({
      ...prev,
      [roomId]: WEEKDAYS.reduce((dayAcc, day) => {
        dayAcc[day] = TIME_SLOTS.reduce((slotAcc, slot) => {
          slotAcc[slot] = !allSelected;
          return slotAcc;
        }, {});
        return dayAcc;
      }, {})
    }));
  };

  // Save room availability
  const saveRoomAvailability = async (roomId) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      const result = await updateRoom(roomId, {
        ...room,
        availability: roomAvailability[roomId]
      });

      if (result.success) {
        setSuccess('Room availability updated successfully');
        // Update the rooms list
        setRooms(prev => prev.map(r => 
          r.id === roomId 
            ? { ...r, availability: roomAvailability[roomId] }
            : r
        ));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to save room availability');
    }
  };

  // Filter rooms based on search and faculty
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.features?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaculty = !filterFaculty || room.faculty === filterFaculty;
    return matchesSearch && matchesFaculty;
  });

  // Get unique faculties for filter
  const faculties = [...new Set(rooms.map(room => room.faculty).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-400 mr-3" />
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-400 mr-3" />
            <p className="text-green-700">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-400 hover:text-green-600">
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Room Availability Assignment Interface */}
      <div className="flex gap-6 h-[calc(100vh-240px)]">
        {/* Left Panel - Room List */}
        <div className="w-2/5 flex flex-col">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaBuilding className="text-blue-600" />
                Select Room
              </h3>
              
              {/* Search and Filter */}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <select
                  value={filterFaculty}
                  onChange={(e) => setFilterFaculty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Faculties</option>
                  {faculties.map(faculty => (
                    <option key={faculty} value={faculty}>{faculty}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Scrollable Room List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleRoomSelection(room)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedRoom?.id === room.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{room.name}</div>
                        <div className="text-sm text-gray-500">
                          {room.code} • {room.faculty}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <FaUsers className="text-xs" />
                          Capacity: {room.capacity}
                          {room.floor && ` • Floor ${room.floor}`}
                        </div>
                      </div>
                      {selectedRoom?.id === room.id && (
                        <FaCheckCircle className="text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredRooms.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FaBuilding className="text-3xl mx-auto mb-2 opacity-50" />
                    <p>No rooms found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Availability Grid */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
              {/* Fixed Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaClock className="text-blue-600" />
                    Availability for {selectedRoom.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectAllGrid(selectedRoom.id)}
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FaCheck className="text-xs" />
                      {WEEKDAYS.every(day => 
                        TIME_SLOTS.every(slot => roomAvailability[selectedRoom.id]?.[day]?.[slot])
                      ) ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={() => saveRoomAvailability(selectedRoom.id)}
                      className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <FaSave />
                      Save
                    </button>
                  </div>
                </div>
              </div>

              {/* Fixed Availability Grid */}
              <div className="flex-1 overflow-auto p-6 pt-0">
                <div className="min-w-full">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 p-3 bg-gray-50 text-sm font-medium sticky top-0 left-0 z-20 min-w-[120px]">
                          Time Slots
                        </th>
                        {WEEKDAYS.map(day => (
                          <th key={day} className="border border-gray-300 p-3 bg-gray-50 text-sm font-medium sticky top-0 z-10 min-w-[120px]">
                            <div className="flex flex-col items-center gap-2">
                              <span className="font-semibold">{day}</span>
                              <button
                                onClick={() => handleSelectAllDay(selectedRoom.id, day)}
                                className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded transition-colors"
                              >
                                {TIME_SLOTS.every(slot => roomAvailability[selectedRoom.id]?.[day]?.[slot]) ? 'Clear' : 'All'}
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TIME_SLOTS.map(slot => (
                        <tr key={slot}>
                          <td className="border border-gray-300 p-3 bg-gray-50 text-sm font-medium sticky left-0 z-10">
                            <div className="whitespace-nowrap">{slot}</div>
                          </td>
                          {WEEKDAYS.map(day => (
                            <td key={`${day}-${slot}`} className="border border-gray-300 p-3 text-center">
                              <label className="flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={roomAvailability[selectedRoom.id]?.[day]?.[slot] || false}
                                  onChange={() => handleAvailabilityChange(selectedRoom.id, day, slot)}
                                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <strong>Room:</strong> {selectedRoom.name} ({selectedRoom.code})
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Capacity:</strong> {selectedRoom.capacity} students
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Faculty:</strong> {selectedRoom.faculty}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center h-full flex flex-col justify-center">
              <FaClock className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Room</h3>
              <p className="text-gray-500">Choose a room from the left panel to manage its availability schedule</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomAvailability;
