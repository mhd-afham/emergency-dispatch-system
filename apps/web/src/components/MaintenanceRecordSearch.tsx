import React, { useState } from 'react';
import { equipmentService } from '../services/equipment';

interface SearchFilters {
  vehicleNumber: string;
  recordType: '' | 'ROUTINE' | 'CORRECTIVE' | 'EMERGENCY';
  priority: '' | 'LOW' | 'MEDIUM' | 'HIGH';
  status: '' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  dateFrom: string;
  dateTo: string;
}

interface SearchResult {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  recordType: string;
  description: string;
  priority: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

const MaintenanceRecordSearch: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    vehicleNumber: '',
    recordType: '',
    priority: '',
    status: '',
    createdBy: '',
    dateFrom: '',
    dateTo: ''
  });

  const [results, setResults] = useState<SearchResult[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleSearch = async (page: number = 1) => {
    try {
      setIsSearching(true);
      setSearchError(null);

      // Remove empty filters
      const searchParams: any = {
        page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc' as 'desc'
      };

      if (filters.vehicleNumber) searchParams.vehicleNumber = filters.vehicleNumber;
      if (filters.recordType) searchParams.recordType = filters.recordType;
      if (filters.priority) searchParams.priority = filters.priority;
      if (filters.status) searchParams.status = filters.status;
      if (filters.createdBy) searchParams.createdBy = filters.createdBy;
      if (filters.dateFrom) searchParams.dateFrom = filters.dateFrom;
      if (filters.dateTo) searchParams.dateTo = filters.dateTo;

      const response = await equipmentService.searchMaintenanceRecords(searchParams);
      
      setResults(response.records);
      setPagination(response.pagination);
      setCurrentPage(page);

    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search maintenance records. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownloadPDF = async (recordId: string, vehicleNumber: string) => {
    try {
      setIsDownloading(recordId);
      await equipmentService.downloadMaintenancePDFFile(
        recordId, 
        `maintenance-${vehicleNumber}-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleReset = () => {
    setFilters({
      vehicleNumber: '',
      recordType: '',
      priority: '',
      status: '',
      createdBy: '',
      dateFrom: '',
      dateTo: ''
    });
    setResults([]);
    setPagination(null);
    setCurrentPage(1);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Search Maintenance Records</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Vehicle Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Number
            </label>
            <input
              type="text"
              value={filters.vehicleNumber}
              onChange={(e) => setFilters(prev => ({ ...prev, vehicleNumber: e.target.value }))}
              placeholder="e.g., CAB-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Record Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Record Type
            </label>
            <select
              value={filters.recordType}
              onChange={(e) => setFilters(prev => ({ ...prev, recordType: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="ROUTINE">Routine</option>
              <option value="CORRECTIVE">Corrective</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Created By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created By
            </label>
            <input
              type="text"
              value={filters.createdBy}
              onChange={(e) => setFilters(prev => ({ ...prev, createdBy: e.target.value }))}
              placeholder="Email or name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={() => handleSearch(1)}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : '🔍 Search'}
          </button>
        </div>

        {searchError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-red-800 text-sm">{searchError}</div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-green-900">Search Results</h3>
              </div>
              <div className="text-sm text-green-700">
                Found {pagination?.total || 0} record(s)
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {results.map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-semibold text-gray-900">{record.vehicleNumber}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(record.priority)}`}>
                          {record.priority}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                        <span className="text-xs text-gray-500">{record.recordType}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{record.description}</p>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>👤 {record.createdBy}</span>
                        <span>📅 {new Date(record.createdAt).toLocaleDateString()}</span>
                        <span>🚗 {record.vehicleType}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadPDF(record.id, record.vehicleNumber)}
                      disabled={isDownloading === record.id}
                      className="ml-4 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                    >
                      {isDownloading === record.id ? '⏳' : '📄 PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSearch(currentPage - 1)}
                    disabled={!pagination.hasPrevPage || isSearching}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleSearch(currentPage + 1)}
                    disabled={!pagination.hasNextPage || isSearching}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {!isSearching && results.length === 0 && pagination && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600">No maintenance records found matching your search criteria.</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceRecordSearch;
