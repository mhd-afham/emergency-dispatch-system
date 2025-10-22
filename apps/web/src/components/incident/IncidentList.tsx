import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationModal from '../common/NotificationModal';
import { useNotification } from '../../hooks/useNotification';

interface Incident {
  _id: string;
  incidentId: string;
  callerInfo: {
    name: string;
    contactNumber: string;
    reportingMethod: string;
  };
  incidentType: string;
  incidentCategory: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: {
    address: string;
    city: string;
    province: string;
  };
  status: string;
  createdAt: string;
  loggedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface IncidentListProps {
  onIncidentUpdate?: () => void;
}

const IncidentList: React.FC<IncidentListProps> = ({ onIncidentUpdate }) => {
  const { user } = useAuth();
  const { notification, showSuccess, showError, showConfirm, hideNotification, handleConfirm } = useNotification();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'id' | 'caller' | 'location' | 'type' | 'status' | 'severity'>('all');
  const [loading, setLoading] = useState(true);
  const [editingIncident, setEditingIncident] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Incident>>({});

  const severityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    assigned: 'bg-blue-100 text-blue-800',
    en_route: 'bg-purple-100 text-purple-800',
    on_scene: 'bg-indigo-100 text-indigo-800',
    resolved: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Filter incidents based on search term and filter type
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredIncidents(incidents);
      return;
    }

    const search = searchTerm.toLowerCase().trim();
    
    // Helper function to check if search matches start of word
    const startsWithSearch = (text: string) => {
      const lowerText = text.toLowerCase();
      // Check if starts with search term OR any word in text starts with search term
      return lowerText.startsWith(search) || 
             lowerText.split(/\s+/).some(word => word.startsWith(search));
    };

    const filtered = incidents.filter(incident => {
      // Filter by specific field based on searchFilter
      switch (searchFilter) {
        case 'id':
          return startsWithSearch(incident.incidentId);
        
        case 'caller':
          return (
            startsWithSearch(incident.callerInfo.name) ||
            incident.callerInfo.contactNumber.startsWith(search)
          );
        
        case 'location':
          return (
            startsWithSearch(incident.location.address) ||
            startsWithSearch(incident.location.city) ||
            startsWithSearch(incident.location.province)
          );
        
        case 'type':
          return (
            startsWithSearch(incident.incidentType) ||
            startsWithSearch(incident.incidentCategory)
          );
        
        case 'status':
          return startsWithSearch(incident.status);
        
        case 'severity':
          return startsWithSearch(incident.severity);
        
        case 'all':
        default:
          // Search in all fields - match start of words
          return (
            startsWithSearch(incident.incidentId) ||
            startsWithSearch(incident.callerInfo.name) ||
            incident.callerInfo.contactNumber.startsWith(search) ||
            startsWithSearch(incident.incidentType) ||
            startsWithSearch(incident.incidentCategory) ||
            startsWithSearch(incident.description) ||
            startsWithSearch(incident.location.address) ||
            startsWithSearch(incident.location.city) ||
            startsWithSearch(incident.location.province) ||
            startsWithSearch(incident.status) ||
            startsWithSearch(incident.severity)
          );
      }
    });

    setFilteredIncidents(filtered);
  }, [searchTerm, searchFilter, incidents]);

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/incidents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIncidents(data.data.incidents || []);
        setFilteredIncidents(data.data.incidents || []);
      } else {
        console.error('Failed to fetch incidents');
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (incident: Incident) => {
    setEditingIncident(incident._id);
    setEditForm({
      severity: incident.severity,
      description: incident.description,
      status: incident.status,
      location: { ...incident.location }
    });
  };

  const handleSave = async (incidentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/incidents/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await fetchIncidents(); // Refresh the list
        setEditingIncident(null);
        setEditForm({});
        if (onIncidentUpdate) onIncidentUpdate();
        showSuccess(
          'Incident Updated Successfully!',
          'The incident details have been updated and saved.',
          'Continue'
        );
      } else {
        const error = await response.json();
        showError(
          'Failed to Update Incident',
          error.message || 'An error occurred while updating the incident. Please try again.',
          'Try Again'
        );
      }
    } catch (error) {
      console.error('Error updating incident:', error);
      showError(
        'Connection Error',
        'Failed to connect to the server. Please check your internet connection and try again.',
        'Retry'
      );
    }
  };

  const handleCancelIncident = async (incidentId: string) => {
    const performCancel = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/incidents/${incidentId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'cancelled' })
        });

        if (response.ok) {
          await fetchIncidents(); // Refresh the list
          if (onIncidentUpdate) onIncidentUpdate();
          showSuccess(
            'Incident Cancelled Successfully!',
            'The incident status has been changed to cancelled.',
            'Continue'
          );
        } else {
          const error = await response.json();
          showError(
            'Failed to Cancel Incident',
            error.message || 'An error occurred while cancelling the incident. Please try again.',
            'Try Again'
          );
        }
      } catch (error) {
        console.error('Error cancelling incident:', error);
        showError(
          'Connection Error',
          'Failed to connect to the server. Please check your internet connection and try again.',
          'Retry'
        );
      }
    };

    showConfirm(
      'Cancel Incident',
      'Are you sure you want to cancel this incident? This will change the status to cancelled but keep the record.',
      performCancel,
      'Cancel Incident',
      'Keep Active'
    );
  };

  const handlePermanentDelete = async (incidentId: string, incidentIdDisplay: string) => {
    const performDelete = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/incidents/${incidentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          await fetchIncidents(); // Refresh the list
          if (onIncidentUpdate) onIncidentUpdate();
          showSuccess(
            'Incident Permanently Deleted!',
            `Incident ${incidentIdDisplay} has been permanently removed from the database.`,
            'Continue'
          );
        } else {
          const error = await response.json();
          showError(
            'Failed to Delete Incident',
            error.message || 'An error occurred while deleting the incident. Please try again.',
            'Try Again'
          );
        }
      } catch (error) {
        console.error('Error deleting incident:', error);
        showError(
          'Connection Error',
          'Failed to connect to the server. Please check your internet connection and try again.',
          'Retry'
        );
      }
    };

    showConfirm(
      '⚠️ Permanent Delete Warning',
      `Are you absolutely sure you want to permanently delete incident ${incidentIdDisplay}?\n\nThis action CANNOT be undone and will remove all data from the database forever.`,
      performDelete,
      'Delete Permanently',
      'Keep Incident'
    );
  };

  const handleCancelEdit = () => {
    setEditingIncident(null);
    setEditForm({});
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-LK', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            All Incidents ({filteredIncidents.length}{searchTerm && ` of ${incidents.length}`})
          </h3>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 items-start">
          {/* Filter Dropdown */}
          <div className="flex-shrink-0">
            <select
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value as any)}
              className="h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            >
              <option value="all">All Fields</option>
              <option value="id">Incident ID</option>
              <option value="caller">Caller</option>
              <option value="location">Location</option>
              <option value="type">Type</option>
              <option value="status">Status</option>
              <option value="severity">Severity</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder={
                searchFilter === 'all' ? "Search all fields..." :
                searchFilter === 'id' ? "Search by Incident ID..." :
                searchFilter === 'caller' ? "Search by caller name or phone..." :
                searchFilter === 'location' ? "Search by address, city, or province..." :
                searchFilter === 'type' ? "Search by incident type or category..." :
                searchFilter === 'status' ? "Search by status (pending, active, resolved)..." :
                "Search by severity (low, medium, high, critical)..."
              }
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search Results Summary */}
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            {filteredIncidents.length === 0 ? (
              <span className="text-red-600">No incidents found matching "{searchTerm}"</span>
            ) : (
              <span className="text-green-600">
                Found {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </span>
            )}
          </div>
        )}
      </div>

      {filteredIncidents.length === 0 ? (
        <div className="px-6 py-8 text-center">
          {searchTerm ? (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No matching incidents</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search term or clear the filter.
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by creating your first emergency incident report above.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Caller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIncidents.map((incident) => (
                <tr key={incident._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {incident.incidentId}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {editingIncident === incident._id ? (
                          <textarea
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            rows={2}
                          />
                        ) : (
                          incident.description
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {incident.callerInfo.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {incident.callerInfo.contactNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {incident.incidentType}
                    </div>
                    <div>
                      {editingIncident === incident._id ? (
                        <select
                          value={editForm.severity || incident.severity}
                          onChange={(e) => setEditForm({ ...editForm, severity: e.target.value as any })}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${severityColors[incident.severity]}`}>
                          {incident.severity}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {editingIncident === incident._id ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editForm.location?.address || ''}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              location: { 
                                address: e.target.value,
                                city: editForm.location?.city || incident.location.city,
                                province: editForm.location?.province || incident.location.province
                              }
                            })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="Address"
                          />
                          <input
                            type="text"
                            value={editForm.location?.city || ''}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              location: { 
                                address: editForm.location?.address || incident.location.address,
                                city: e.target.value,
                                province: editForm.location?.province || incident.location.province
                              }
                            })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="City"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="truncate">{incident.location.address}</div>
                          <div className="text-sm text-gray-500">
                            {incident.location.city}, {incident.location.province}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[incident.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                      {incident.status.replace('_', ' ')}
                    </span>
                    {editingIncident === incident._id && (
                      <p className="text-xs text-gray-500 mt-1">Status cannot be edited here. Use Cancel button to cancel incident.</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(incident.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingIncident === incident._id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave(incident._id)}
                          className="text-green-600 hover:text-green-900 text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(incident)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCancelIncident(incident._id)}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(incident._id, incident.incidentId)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        onConfirm={handleConfirm}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        confirmText={notification.confirmText}
        cancelText={notification.cancelText}
      />
    </div>
  );
};

export default IncidentList;