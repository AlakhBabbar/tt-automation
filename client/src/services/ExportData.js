// Export Data Service - Fetch all collections and save to JSON
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * Fetch all documents from a Firestore collection
 * @param {string} collectionName - Name of the collection to fetch
 * @returns {Promise<Array>} Array of documents with their IDs
 */
const fetchCollection = async (collectionName) => {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Fetched ${data.length} documents from ${collectionName}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching ${collectionName}:`, error);
    return [];
  }
};

/**
 * Fetch all collections (timetables, courses, teachers, rooms)
 * @returns {Promise<Object>} Object containing all collection data
 */
export const fetchAllCollections = async () => {
  try {
    console.log('🔄 Fetching all collections...');
    
    const [timetables, courses, teachers, rooms] = await Promise.all([
      fetchCollection('timetables'),
      fetchCollection('courses'),
      fetchCollection('teachers'),
      fetchCollection('rooms')
    ]);
    
    const allData = {
      timetables,
      courses,
      teachers,
      rooms,
      exportedAt: new Date().toISOString(),
      totalDocuments: timetables.length + courses.length + teachers.length + rooms.length
    };
    
    console.log('✅ All collections fetched successfully');
    console.log(`📊 Total documents: ${allData.totalDocuments}`);
    
    return allData;
  } catch (error) {
    console.error('❌ Error fetching all collections:', error);
    throw error;
  }
};

/**
 * Download data as JSON file
 * @param {Object} data - Data to download
 * @param {string} filename - Name of the file (default: 'firestore-export.json')
 */
export const downloadAsJSON = (data, filename = 'firestore-export.json') => {
  try {
    // Convert data to JSON string with pretty formatting
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Downloaded: ${filename}`);
  } catch (error) {
    console.error('❌ Error downloading JSON:', error);
    throw error;
  }
};

/**
 * Export all Firestore collections to JSON file
 * @param {string} filename - Optional filename (default: 'firestore-export-TIMESTAMP.json')
 */
export const exportAllCollectionsToJSON = async (filename) => {
  try {
    // Fetch all data
    const allData = await fetchAllCollections();
    
    // Generate filename with timestamp if not provided
    const defaultFilename = `firestore-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const exportFilename = filename || defaultFilename;
    
    // Download as JSON
    downloadAsJSON(allData, exportFilename);
    
    return {
      success: true,
      message: 'Data exported successfully',
      filename: exportFilename,
      documentsExported: allData.totalDocuments
    };
  } catch (error) {
    console.error('❌ Export failed:', error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Export a single collection to JSON file
 * @param {string} collectionName - Name of the collection to export
 * @param {string} filename - Optional filename
 */
export const exportCollectionToJSON = async (collectionName, filename) => {
  try {
    const data = await fetchCollection(collectionName);
    
    const exportData = {
      collection: collectionName,
      data,
      exportedAt: new Date().toISOString(),
      totalDocuments: data.length
    };
    
    const defaultFilename = `${collectionName}-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const exportFilename = filename || defaultFilename;
    
    downloadAsJSON(exportData, exportFilename);
    
    return {
      success: true,
      message: `${collectionName} exported successfully`,
      filename: exportFilename,
      documentsExported: data.length
    };
  } catch (error) {
    console.error('❌ Export failed:', error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Get collection statistics without downloading
 * @returns {Promise<Object>} Statistics for all collections
 */
export const getCollectionStats = async () => {
  try {
    const [timetables, courses, teachers, rooms] = await Promise.all([
      fetchCollection('timetables'),
      fetchCollection('courses'),
      fetchCollection('teachers'),
      fetchCollection('rooms')
    ]);
    
    return {
      timetables: {
        count: timetables.length,
        sampleData: timetables.slice(0, 3)
      },
      courses: {
        count: courses.length,
        sampleData: courses.slice(0, 3)
      },
      teachers: {
        count: teachers.length,
        sampleData: teachers.slice(0, 3)
      },
      rooms: {
        count: rooms.length,
        sampleData: rooms.slice(0, 3)
      },
      total: timetables.length + courses.length + teachers.length + rooms.length
    };
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    throw error;
  }
};

export default {
  fetchAllCollections,
  fetchCollection,
  downloadAsJSON,
  exportAllCollectionsToJSON,
  exportCollectionToJSON,
  getCollectionStats
};
