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

const COLLECTION_NAME = 'rooms';

// Get all rooms
export const getAllRooms = async () => {
  try {
    const roomsRef = collection(db, COLLECTION_NAME);
    const q = query(roomsRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const rooms = [];
    querySnapshot.forEach((doc) => {
      rooms.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      data: rooms
    };
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Add a new room
export const addRoom = async (roomData) => {
  try {
    // Validate required fields (all except features)
    if (!roomData.name || !roomData.code || !roomData.faculty || 
        !roomData.capacity || !roomData.floor) {
      return {
        success: false,
        error: 'Missing required fields: name, code, faculty, capacity, and floor are required'
      };
    }

    // Check if room code already exists
    const existingRooms = await getAllRooms();
    if (existingRooms.success) {
      const codeExists = existingRooms.data.some(
        room => room.code.toLowerCase() === roomData.code.toLowerCase()
      );
      
      if (codeExists) {
        return {
          success: false,
          error: 'Room code already exists'
        };
      }
    }

    const roomsRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(roomsRef, {
      ...roomData,
      capacity: parseInt(roomData.capacity) || 0,
      floor: parseInt(roomData.floor) || 0,
      features: roomData.features || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      data: { id: docRef.id, ...roomData }
    };
  } catch (error) {
    console.error('Error adding room:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update an existing room
export const updateRoom = async (roomId, roomData) => {
  try {
    if (!roomId) {
      return {
        success: false,
        error: 'Room ID is required'
      };
    }

    // Validate required fields
    if (!roomData.name || !roomData.code || !roomData.faculty || 
        !roomData.capacity || !roomData.floor) {
      return {
        success: false,
        error: 'Missing required fields: name, code, faculty, capacity, and floor are required'
      };
    }

    // Check if room code already exists (excluding current room)
    const existingRooms = await getAllRooms();
    if (existingRooms.success) {
      const codeExists = existingRooms.data.some(
        room => room.code.toLowerCase() === roomData.code.toLowerCase() && room.id !== roomId
      );
      
      if (codeExists) {
        return {
          success: false,
          error: 'Room code already exists'
        };
      }
    }

    const roomRef = doc(db, COLLECTION_NAME, roomId);
    await updateDoc(roomRef, {
      ...roomData,
      capacity: parseInt(roomData.capacity) || 0,
      floor: parseInt(roomData.floor) || 0,
      features: roomData.features || '',
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      data: { id: roomId, ...roomData }
    };
  } catch (error) {
    console.error('Error updating room:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete a room
export const deleteRoom = async (roomId) => {
  try {
    if (!roomId) {
      return {
        success: false,
        error: 'Room ID is required'
      };
    }

    const roomRef = doc(db, COLLECTION_NAME, roomId);
    await deleteDoc(roomRef);
    
    return {
      success: true,
      data: { id: roomId }
    };
  } catch (error) {
    console.error('Error deleting room:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get room statistics
export const getRoomStatistics = async () => {
  try {
    const result = await getAllRooms();
    if (!result.success) {
      return result;
    }

    const rooms = result.data;
    const faculties = [...new Set(rooms.map(room => room.faculty).filter(Boolean))];
    const floors = [...new Set(rooms.map(room => room.floor).filter(Boolean))];
    const totalCapacity = rooms.reduce((sum, room) => sum + (parseInt(room.capacity) || 0), 0);

    return {
      success: true,
      data: {
        totalRooms: rooms.length,
        faculties: faculties.length,
        floors: floors.length,
        totalCapacity: totalCapacity
      }
    };
  } catch (error) {
    console.error('Error calculating room statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// CSV Export
export const exportRoomsToCSV = (rooms) => {
  const headers = ['Name', 'Code', 'Faculty', 'Capacity', 'Features', 'Floor'];
  const csvContent = [
    headers.join(','),
    ...rooms.map(room => [
      `"${room.name || ''}"`,
      `"${room.code || ''}"`,
      `"${room.faculty || ''}"`,
      room.capacity || 0,
      `"${room.features || ''}"`,
      room.floor || 0
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `rooms_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// CSV Import
export const importRoomsFromCSV = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          resolve({
            success: false,
            error: 'CSV file appears to be empty or invalid'
          });
          return;
        }

        // Parse CSV properly handling quoted fields
        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim().toLowerCase());
        const dataLines = lines.slice(1);
        
        const requiredFields = ['name', 'code', 'faculty', 'capacity', 'floor'];
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        
        if (missingFields.length > 0) {
          resolve({
            success: false,
            error: `Missing required columns: ${missingFields.join(', ')}`
          });
          return;
        }

        const rooms = [];
        const errors = [];

        for (let i = 0; i < dataLines.length; i++) {
          const line = dataLines[i];
          if (!line.trim()) continue;

          const values = parseCSVLine(line).map(v => v.replace(/"/g, '').trim());
          
          if (values.length !== headers.length) {
            errors.push(`Row ${i + 2}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
            continue;
          }

          const roomData = {};
          headers.forEach((header, index) => {
            roomData[header] = values[index];
          });

          // Validate required fields
          const missingRequired = requiredFields.filter(field => !roomData[field]);
          if (missingRequired.length > 0) {
            errors.push(`Row ${i + 2}: Missing required fields: ${missingRequired.join(', ')}`);
            continue;
          }

          // Convert numeric fields
          roomData.capacity = parseInt(roomData.capacity) || 0;
          roomData.floor = parseInt(roomData.floor) || 0;

          rooms.push(roomData);
        }

        if (errors.length > 0) {
          resolve({
            success: false,
            error: `Import errors:\n${errors.join('\n')}`
          });
          return;
        }

        // Import rooms
        const results = [];
        for (const roomData of rooms) {
          const result = await addRoom(roomData);
          results.push(result);
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success);

        if (failed.length > 0) {
          resolve({
            success: false,
            error: `Imported ${successful} rooms successfully. ${failed.length} failed:\n${failed.map(f => f.error).join('\n')}`
          });
        } else {
          resolve({
            success: true,
            data: `Successfully imported ${successful} rooms`
          });
        }

      } catch (error) {
        resolve({
          success: false,
          error: `Error processing CSV: ${error.message}`
        });
      }
    };

    reader.readAsText(file);
  });
};

// Generate CSV template
export const downloadRoomTemplate = () => {
  const headers = [
    'name',
    'code', 
    'faculty',
    'capacity',
    'features',
    'floor'
  ];
  
  const sampleData = [
    '"Lecture Hall 1"',
    '"LH001"',
    '"Engineering"',
    '100',
    '"Projector, WiFi, Sound System"',
    '1'
  ];

  const csvContent = [
    headers.join(','),
    sampleData.join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'room_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
