import React, { useState, useEffect } from 'react';
import { equipmentService, EquipmentCheck } from '../../services/equipment';

interface EquipmentCheckListProps {
  vehicleId?: string;
  className?: string;
}

const EquipmentCheckList: React.FC<EquipmentCheckListProps> = ({ vehicleId, className = '' }) => {
  const [checks, setChecks] = useState<EquipmentCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalChecks, setTotalChecks] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    vehicleType: '',
    startDate: '',
    endDate: '',
    sortBy: 'audit.createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  useEffect(() => {
    loadEquipmentChecks();
  }, [currentPage, filters, vehicleId]);

  const loadEquipmentChecks = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 10,
        ...filters
      };

      let data;
      if (vehicleId) {
        data = await equipmentService.getVehicleEquipmentChecks(vehicleId, params);
      } else {
        data = await equipmentService.getAllEquipmentChecks(params);
      }

      setChecks(data.equipmentChecks);
      setTotalPages(data.pagination.totalPages);
      setTotalChecks(data.pagination.totalChecks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load equipment checks');
      console.error('Equipment checks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSort = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
    setCurrentPage(1);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'passed':
        return 'text-green-600 bg-green-100';
      case 'minor_issues':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical_failure':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && checks.length === 0) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {vehicleId ? 'Vehicle Equipment Checks' : 'All Equipment Checks'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {totalChecks} checks found
          </p>
        </div>
        <button
          onClick={() => {
            console.log('Export equipment checks');
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          📊 Export
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="passed">Passed</option>
            <option value="minor_issues">Minor Issues</option>
            <option value="critical_failure">Critical Failure</option>
          </select>
        </div>

        {!vehicleId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
            <select
              value={filters.vehicleType}
              onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="ambulance">Ambulance</option>
              <option value="fire_engine">Fire Engine</option>
              <option value="rescue_vehicle">Rescue Vehicle</option>
              <option value="support_vehicle">Support Vehicle</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setFilters({
                status: '',
                vehicleType: '',
                startDate: '',
                endDate: '',
                sortBy: 'audit.createdAt',
                sortOrder: 'desc'
              });
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">❌</span>
            <span className="text-red-700">{error}</span>
            <button
              onClick={loadEquipmentChecks}
              className="ml-auto text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Equipment Checks Table */}
      {checks.length === 0 && !loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🔧</div>
          <p className="text-xl mb-2">No equipment checks found</p>
          <p>Try adjusting your filters or create a new equipment check.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th 
                  className="text-left py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('vehicleId.registration.plateNumber')}
                >
                  Vehicle {filters.sortBy.includes('vehicleId') && (
                    <span className="ml-1">{filters.sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </th>
                <th 
                  className="text-left py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('crewId.personal.firstName')}
                >
                  Inspector {filters.sortBy.includes('crewId') && (
                    <span className="ml-1">{filters.sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </th>
                <th 
                  className="text-left py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('inspection.overallStatus')}
                >
                  Status {filters.sortBy.includes('overallStatus') && (
                    <span className="ml-1">{filters.sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Results</th>
                <th 
                  className="text-left py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('audit.createdAt')}
                >
                  Date {filters.sortBy.includes('createdAt') && (
                    <span className="ml-1">{filters.sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr key={check._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {check.vehicleId?.registration?.plateNumber || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {check.vehicleId?.type?.replace('_', ' ')} - {check.vehicleId?.specifications?.model}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {check.crewId?.personal?.firstName} {check.crewId?.personal?.lastName}
                      </div>
                      <div className="text-gray-500">{check.crewId?.professional?.role}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(check.inspection.overallStatus)}`}>
                      {check.inspection.overallStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2 text-sm">
                      <span className="text-green-600 bg-green-100 px-2 py-1 rounded">
                        ✓ {check.inspection.passCount}
                      </span>
                      {check.inspection.failCount > 0 && (
                        <span className="text-red-600 bg-red-100 px-2 py-1 rounded">
                          ✗ {check.inspection.failCount}
                        </span>
                      )}
                      {check.inspection.warningCount > 0 && (
                        <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                          ⚠ {check.inspection.warningCount}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {formatDateTime(check.audit.createdAt.toString())}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          console.log('View check details:', check._id);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          console.log('Print check:', check._id);
                        }}
                        className="text-gray-600 hover:text-gray-900 text-sm"
                      >
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalChecks)} of {totalChecks} checks
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && checks.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      )}
    </div>
  );
};

export default EquipmentCheckList;