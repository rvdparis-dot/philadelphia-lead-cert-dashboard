// Updated React component with better error handling and API integration
// Add this to your existing frontend or replace the API call section

const LeadCertificationApp = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalRows, setTotalRows] = useState(0);
  const [apiTest, setApiTest] = useState(null);

  // Enhanced search function
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term (address, OPA account, etc.)');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      console.log('Searching for:', searchTerm);
      
      const searchParams = new URLSearchParams({
        search: searchTerm.trim(),
        limit: '50'
      });

      const response = await fetch(`/api/leadcert?${searchParams.toString()}`);
      const data = await response.json();

      console.log('API Response:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }

      setResults(data.data || []);
      setTotalRows(data.totalRows || 0);

      if (data.data && data.data.length === 0) {
        setError(`No lead certification records found for "${searchTerm}". Try a different address or OPA account number.`);
      }

    } catch (err) {
      console.error('Search error:', err);
      setError(`Search failed: ${err.message}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // API Test function
  const runApiTest = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test-leadcert');
      const testData = await response.json();
      setApiTest(testData);
      console.log('API Test Results:', testData);
    } catch (err) {
      console.error('API test error:', err);
      setApiTest({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced property card component
  const PropertyCard = ({ property }) => {
    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'in compliance': return 'bg-green-100 text-green-800 border-green-200';
        case 'non-compliant': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      }
    };

    const getRiskColor = (risk) => {
      switch (risk?.toLowerCase()) {
        case 'critical': return 'bg-red-500';
        case 'high': return 'bg-orange-500';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-green-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {property.fullAddress || property.address}
            </h3>
            <p className="text-sm text-gray-600">
              OPA Account: {property.opaAccountNum}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(property.complianceStatus)}`}>
              {property.complianceStatus || 'Unknown'}
            </span>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getRiskColor(property.riskLevel)}`}></div>
              <span className="text-xs text-gray-600">{property.riskLevel} Risk</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Certification Type:</span>
            <p className="text-gray-600">{property.certType || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <p className="text-gray-600">{property.certStatus || 'Unknown'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Certification Date:</span>
            <p className="text-gray-600">{property.certDate || 'Not available'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Expiry Date:</span>
            <p className={`font-medium ${property.isExpiringSoon ? 'text-orange-600' : 'text-gray-600'}`}>
              {property.certExpiry || 'Not available'}
            </p>
          </div>
        </div>

        {property.daysUntilExpiry !== null && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Days until expiry:</span>
              <span className={`font-bold ${
                property.daysUntilExpiry < 0 ? 'text-red-600' :
                property.daysUntilExpiry <= 30 ? 'text-orange-600' :
                'text-green-600'
              }`}>
                {property.daysUntilExpiry < 0 ? 'EXPIRED' : `${property.daysUntilExpiry} days`}
              </span>
            </div>
          </div>
        )}

        {property.inspectorCompany && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
            <span className="font-medium text-gray-700">Inspector:</span>
            <p className="text-gray-600">{property.inspectorCompany}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Philadelphia Lead Certification Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Search official lead certification records from Philadelphia Department of Public Health
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={runApiTest}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                Test API
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search by Address, OPA Account, or Property Details
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
                placeholder="e.g., 808 W Norris, 123456789, Center City"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mt-7"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div>
                <h3 className="font-medium text-red-900">Search Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Found {totalRows} lead certification record{totalRows !== 1 ? 's' : ''}
              </h2>
              <div className="text-sm text-gray-600">
                Showing {results.length} of {totalRows} results
              </div>
            </div>
            
            <div className="grid gap-6">
              {results.map((property, index) => (
                <PropertyCard key={property.objectid || index} property={property} />
              ))}
            </div>
          </div>
        )}

        {/* API Test Results */}
        {apiTest && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">API Test Results</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
              {JSON.stringify(apiTest, null, 2)}
            </pre>
          </div>
        )}

        {/* No Results State */}
        {!loading && searchTerm && results.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-600 mb-6">
              No lead certification records match your search. Try a different address or OPA account number.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching Philadelphia lead certification database...</p>
          </div>
        )}
      </div>
    </div>
  );
};
