import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { getIncidents, Incident, IncidentFilters } from '../../services/incidents';

interface IncidentListProps {
  onViewIncident?: (incident: Incident) => void;
  onEditIncident?: (incident: Incident) => void;
  refreshTrigger?: number;
}

const IncidentList: React.FC<IncidentListProps> = ({
  onViewIncident,
  onEditIncident,
  refreshTrigger,
}) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<IncidentFilters>({
    page: 1,
    limit: 10,
    sortBy: 'audit.createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalIncidents: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getIncidents(filters);
      setIncidents(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch incidents');
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [filters, refreshTrigger]);

  const handleFilterChange = (key: keyof IncidentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1, // Reset to page 1 unless changing page directly
    }));
  };

  const handleSearch = (searchTerm: string) => {
    handleFilterChange('search', searchTerm);
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'logged': return 'bg-blue-100 text-blue-800';
      case 'dispatched': return 'bg-yellow-100 text-yellow-800';
      case 'en route': return 'bg-orange-100 text-orange-800';
      case 'on scene': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 font-semibold';
      case 'high': return 'text-orange-600 font-medium';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'medical': return '🚑';
      case 'fire': return '🚒';
      case 'rescue': return '🚁';
      case 'police': return '🚔';
      default: return '📞';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ClockIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Logged">Logged</option>
                <option value="Dispatched">Dispatched</option>
                <option value="En Route">En Route</option>
                <option value="On Scene">On Scene</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="Medical">Medical</option>
                <option value="Fire">Fire</option>
                <option value="Rescue">Rescue</option>
                <option value="Police">Police</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={filters.severity || ''}
                onChange={(e) => handleFilterChange('severity', e.target.value || undefined)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={`${filters.sortBy}:${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split(':');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="audit.createdAt:desc">Newest First</option>
                <option value="audit.createdAt:asc">Oldest First</option>
                <option value="classification.severity:desc">Severity (High to Low)</option>
                <option value="classification.severity:asc">Severity (Low to High)</option>
                <option value="incidentId:asc">Incident ID</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Incidents List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {incidents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No incidents found matching your criteria.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Incidents ({pagination.totalIncidents})
                </h3>
                <p className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </p>
              </div>
            </div>

            {/* Incidents */}
            <div className="divide-y divide-gray-200">
              {incidents.map((incident) => (
                <div
                  key={incident._id}
                  className="p-6 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Header Row */}
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(incident.classification.type)}</span>
                        
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-semibold text-blue-600">
                            {incident.incidentId}
                          </span>
                          
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status.current)}`}>
                            {incident.status.current}
                          </span>
                          
                          <span className={`text-sm ${getSeverityColor(incident.classification.severity)}`}>
                            {incident.classification.severity}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {incident.details.description}
                        </p>
                        
                        <p className="text-sm text-gray-600 truncate">
                          📍 {incident.location.address.fullAddress}
                        </p>
                        
                        <p className="text-sm text-gray-500">
                          📞 {incident.caller.phone} {incident.caller.name && `• ${incident.caller.name}`}
                        </p>
                        
                        <p className="text-sm text-gray-500">
                          🕐 {formatTimeAgo(incident.audit.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {onViewIncident && (
                        <button
                          onClick={() => onViewIncident(incident)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {onEditIncident && ['Logged', 'Dispatched'].includes(incident.status.current) && (
                        <button
                          onClick={() => onEditIncident(incident)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="Edit Incident"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage || loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage || loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default IncidentList;