import { useState } from 'react';
import { FiDownload, FiDatabase, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { 
  exportAllCollectionsToJSON, 
  exportCollectionToJSON, 
  getCollectionStats 
} from '../services/ExportData';

const ExportDataComponent = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch collection statistics
  const handleGetStats = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const statistics = await getCollectionStats();
      setStats(statistics);
      setMessage({ 
        type: 'success', 
        text: `Found ${statistics.total} total documents` 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Error fetching stats: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // Export all collections
  const handleExportAll = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const result = await exportAllCollectionsToJSON();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully exported ${result.documentsExported} documents to ${result.filename}` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `Export failed: ${result.message}` 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Export failed: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // Export single collection
  const handleExportCollection = async (collectionName) => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const result = await exportCollectionToJSON(collectionName);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully exported ${result.documentsExported} documents from ${collectionName}` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `Export failed: ${result.message}` 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Export failed: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <FiDatabase className="text-3xl text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Export Firestore Data</h2>
            <p className="text-gray-600">Download all your collections as JSON files</p>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleGetStats}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDatabase />
            {loading ? 'Loading...' : 'Get Statistics'}
          </button>

          <button
            onClick={handleExportAll}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload />
            {loading ? 'Exporting...' : 'Export All Collections'}
          </button>
        </div>

        {/* Individual Collection Export */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Individual Collections</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['timetables', 'courses', 'teachers', 'rooms'].map((collection) => (
              <button
                key={collection}
                onClick={() => handleExportCollection(collection)}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed capitalize font-medium"
              >
                {collection}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Display */}
        {stats && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Collection Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats).map(([key, value]) => {
                if (key === 'total') {
                  return (
                    <div key={key} className="col-span-2 md:col-span-4 p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg">
                      <div className="text-sm font-medium uppercase">Total Documents</div>
                      <div className="text-3xl font-bold mt-1">{value}</div>
                    </div>
                  );
                }
                return (
                  <div key={key} className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 uppercase">{key}</div>
                    <div className="text-2xl font-bold text-gray-800 mt-1">{value.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">📝 Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click "Get Statistics" to see document counts</li>
            <li>• Click "Export All Collections" to download all data as JSON</li>
            <li>• Click individual collection names to export specific collections</li>
            <li>• Files will be downloaded with timestamp in the filename</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExportDataComponent;
