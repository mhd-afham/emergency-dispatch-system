import React, { useState, useEffect } from 'react';
import { equipmentService } from '../services/equipment';

// Custom CSS for animations - inject into head
const injectAnimationStyles = () => {
  const styles = `
    @keyframes slide-in-right {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes scale-in {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .animate-slide-in-right {
      animation: slide-in-right 0.3s ease-out;
    }
    .animate-scale-in {
      animation: scale-in 0.2s ease-out;
    }
  `;
  
  if (!document.head.querySelector('#equipment-animations')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'equipment-animations';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
};

// Inject animations on component load
injectAnimationStyles();

interface Vehicle {
  id: string;
  vehicleNumber: string;
  type: string;
  status: 'READY' | 'AVAILABLE_WITH_RESTRICTIONS' | 'OUT_OF_SERVICE' | 'PENDING_INSPECTION';
  lastCheck: string;
  readinessScore: number;
  location: string;
  assignedCrewLeader: string | null;
  criticalIssues: number;
  nonCriticalIssues: number;
}

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  recordType: 'ROUTINE' | 'CORRECTIVE' | 'EMERGENCY';
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdBy: string;
  createdAt: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

interface EquipmentStatus {
  vehicles: Vehicle[];
  maintenanceRecords: MaintenanceRecord[];
}

const SupervisorEquipmentSection: React.FC = () => {
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  
  // Notification and Confirmation System
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({ show: false, type: 'info', title: '', message: '' });
  
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {} });
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicleId: '',
    recordType: 'ROUTINE' as 'ROUTINE' | 'CORRECTIVE' | 'EMERGENCY',
    description: '',
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW'
  });

  // Notification helper functions
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, show: false }));
      },
      onCancel: () => setConfirmDialog(prev => ({ ...prev, show: false }))
    });
  };

  // Fetch equipment status data
  useEffect(() => {
    const fetchEquipmentStatus = async () => {
      try {
        setLoading(true);
        const response = await equipmentService.getEquipmentStatus();
        setEquipmentStatus(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch equipment status:', err);
        setError('Failed to load equipment status. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipmentStatus();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchEquipmentStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: Vehicle['status']): string => {
    switch (status) {
      case 'READY':
        return 'text-green-600 bg-green-100';
      case 'AVAILABLE_WITH_RESTRICTIONS':
        return 'text-yellow-600 bg-yellow-100';
      case 'OUT_OF_SERVICE':
        return 'text-red-600 bg-red-100';
      case 'PENDING_INSPECTION':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: Vehicle['status']): string => {
    switch (status) {
      case 'READY':
        return 'Ready';
      case 'AVAILABLE_WITH_RESTRICTIONS':
        return 'With Restrictions';
      case 'OUT_OF_SERVICE':
        return 'Out of Service';
      case 'PENDING_INSPECTION':
        return 'Pending Inspection';
      default:
        return 'Unknown';
    }
  };

  const getPriorityColor = (priority: MaintenanceRecord['priority']): string => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'LOW':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleCreateMaintenanceRecord = (vehicle?: Vehicle) => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setMaintenanceForm(prev => ({ ...prev, vehicleId: vehicle.id }));
    } else {
      setSelectedVehicle(null);
      setMaintenanceForm(prev => ({ ...prev, vehicleId: '' }));
    }
    setShowMaintenanceModal(true);
  };

  const submitMaintenanceRecord = async () => {
    if (!maintenanceForm.vehicleId || !maintenanceForm.description.trim()) {
      showNotification('warning', 'Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsCreatingRecord(true);
    try {
      console.log('🔧 Creating maintenance record:', maintenanceForm);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/equipment/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          vehicleId: maintenanceForm.vehicleId,
          recordType: maintenanceForm.recordType,
          description: maintenanceForm.description.trim(),
          priority: maintenanceForm.priority,
          createdBy: 'Supervisor'
        })
      });

      const responseData = await response.json();
      console.log('📝 API Response:', responseData);

      if (response.ok && responseData.success) {
        showNotification('success', 'Success!', 'Maintenance record created successfully!');
        setShowMaintenanceModal(false);
        setMaintenanceForm({
          vehicleId: '',
          recordType: 'ROUTINE',
          description: '',
          priority: 'MEDIUM'
        });
        
        // Refresh the equipment status
        try {
          const statusResponse = await equipmentService.getEquipmentStatus();
          setEquipmentStatus(statusResponse.data);
        } catch (refreshError) {
          console.error('Failed to refresh equipment status:', refreshError);
        }
      } else {
        console.error('❌ API Error:', responseData);
        showNotification('error', 'Creation Failed', `Failed to create maintenance record: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Network Error creating maintenance record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showNotification('error', 'Network Error', `Network error creating maintenance record: ${errorMessage}`);
    } finally {
      setIsCreatingRecord(false);
    }
  };

  const handleEditMaintenanceRecord = (record: MaintenanceRecord) => {
    setEditingRecordId(record.id);
    setMaintenanceForm({
      vehicleId: record.vehicleId,
      recordType: record.recordType,
      description: record.description,
      priority: record.priority
    });
    setShowMaintenanceModal(true);
  };

  const handleDeleteMaintenanceRecord = async (recordId: string) => {
    showConfirmDialog(
      'Delete Maintenance Record',
      'Are you sure you want to delete this maintenance record? This action cannot be undone.',
      async () => {
        setIsDeletingRecord(true);
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/equipment/maintenance/${recordId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          const responseData = await response.json();

          if (response.ok && responseData.success) {
            showNotification('success', 'Deleted!', 'Maintenance record deleted successfully!');
            // Refresh the equipment status
            try {
              const statusResponse = await equipmentService.getEquipmentStatus();
              setEquipmentStatus(statusResponse.data);
            } catch (refreshError) {
              console.error('Failed to refresh equipment status:', refreshError);
            }
          } else {
            showNotification('error', 'Deletion Failed', `Failed to delete maintenance record: ${responseData.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('❌ Network Error deleting maintenance record:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          showNotification('error', 'Network Error', `Network error deleting maintenance record: ${errorMessage}`);
        } finally {
          setIsDeletingRecord(false);
        }
      }
    );
  };

  const handleUpdateMaintenanceRecord = async () => {
    if (!maintenanceForm.vehicleId || !maintenanceForm.description.trim() || !editingRecordId) {
      showNotification('warning', 'Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsEditingRecord(true);
    try {
      console.log('🔧 Updating maintenance record:', editingRecordId, maintenanceForm);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/equipment/maintenance/${editingRecordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          vehicleId: maintenanceForm.vehicleId,
          recordType: maintenanceForm.recordType,
          description: maintenanceForm.description.trim(),
          priority: maintenanceForm.priority
        })
      });

      const responseData = await response.json();
      console.log('📝 Update API Response:', responseData);

      if (response.ok && responseData.success) {
        showNotification('success', 'Updated!', 'Maintenance record updated successfully!');
        setShowMaintenanceModal(false);
        setEditingRecordId(null);
        setMaintenanceForm({
          vehicleId: '',
          recordType: 'ROUTINE',
          description: '',
          priority: 'MEDIUM'
        });
        
        // Refresh the equipment status
        try {
          const statusResponse = await equipmentService.getEquipmentStatus();
          setEquipmentStatus(statusResponse.data);
        } catch (refreshError) {
          console.error('Failed to refresh equipment status:', refreshError);
        }
      } else {
        console.error('❌ API Error:', responseData);
        showNotification('error', 'Update Failed', `Failed to update maintenance record: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Network Error updating maintenance record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showNotification('error', 'Network Error', `Network error updating maintenance record: ${errorMessage}`);
    } finally {
      setIsEditingRecord(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-500 mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Equipment Status Error</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Equipment Status Summary Cards - Moved to Top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600">
                {equipmentStatus?.vehicles.filter(v => v.status === 'READY').length || 0}
              </div>
              <div className="text-sm font-medium text-green-700">Ready Vehicles</div>
              <div className="text-xs text-green-600">Fully operational</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-yellow-600">
                {equipmentStatus?.vehicles.filter(v => v.status === 'AVAILABLE_WITH_RESTRICTIONS').length || 0}
              </div>
              <div className="text-sm font-medium text-yellow-700">With Restrictions</div>
              <div className="text-xs text-yellow-600">Limited availability</div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-red-600">
                {equipmentStatus?.vehicles.filter(v => v.status === 'OUT_OF_SERVICE').length || 0}
              </div>
              <div className="text-sm font-medium text-red-700">Out of Service</div>
              <div className="text-xs text-red-600">Critical failures</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-600">
                {equipmentStatus?.vehicles.filter(v => v.status === 'PENDING_INSPECTION').length || 0}
              </div>
              <div className="text-sm font-medium text-gray-700">Pending Inspection</div>
              <div className="text-xs text-gray-600">Awaiting checks</div>
            </div>
          </div>
        </div>
      </div>
      {/* Equipment Status Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-blue-200 bg-blue-100 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-blue-900">Vehicle Equipment Status</h3>
                <p className="text-sm text-blue-700">UC-005 Digital Equipment Readiness System</p>
              </div>
            </div>
            <button
              onClick={() => handleCreateMaintenanceRecord()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <span className="mr-2">+</span>
              New Maintenance Record
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {equipmentStatus?.vehicles && equipmentStatus.vehicles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Readiness Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issues
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Check
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {equipmentStatus.vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.vehicleNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.type}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.status)}`}>
                          {getStatusText(vehicle.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${vehicle.readinessScore >= 80 ? 'bg-green-600' : vehicle.readinessScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'}`}
                              style={{ width: `${vehicle.readinessScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{vehicle.readinessScore}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          {vehicle.criticalIssues > 0 && (
                            <div className="text-red-600">
                              {vehicle.criticalIssues} Critical
                            </div>
                          )}
                          {vehicle.nonCriticalIssues > 0 && (
                            <div className="text-yellow-600">
                              {vehicle.nonCriticalIssues} Non-Critical
                            </div>
                          )}
                          {vehicle.criticalIssues === 0 && vehicle.nonCriticalIssues === 0 && (
                            <div className="text-green-600">No Issues</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.lastCheck}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleCreateMaintenanceRecord(vehicle)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Maintenance
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No vehicles found. Equipment checks may not have been performed yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Maintenance Records */}
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-green-200 bg-green-100 rounded-t-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-green-900">Recent Maintenance Records</h3>
              <p className="text-sm text-green-700">Latest maintenance activities and requests</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {equipmentStatus?.maintenanceRecords && equipmentStatus.maintenanceRecords.length > 0 ? (
            <div className="space-y-4">
              {equipmentStatus.maintenanceRecords.map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {record.vehicleNumber}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(record.priority)}`}>
                          {record.priority}
                        </span>
                        <span className="text-sm text-gray-500">
                          {record.recordType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {record.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Created by: {record.createdBy}</span>
                        <span>Date: {record.createdAt}</span>
                        <span>Status: {record.status}</span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => handleEditMaintenanceRecord(record)}
                        disabled={isDeletingRecord}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMaintenanceRecord(record.id)}
                        disabled={isDeletingRecord}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        {isDeletingRecord ? '🔄 Deleting...' : '🗑️ Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No maintenance records found.
            </div>
          )}
        </div>
      </div>

      {/* Maintenance Record Creation Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border border-blue-200">
            <div className="px-6 py-4 border-b border-blue-200 bg-blue-50 rounded-t-lg">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-blue-900">
                    {editingRecordId 
                      ? `Edit Maintenance Record ${selectedVehicle ? `- ${selectedVehicle.vehicleNumber}` : ''}` 
                      : selectedVehicle 
                        ? `Create Maintenance Record - ${selectedVehicle.vehicleNumber}` 
                        : 'Create Maintenance Record'
                    }
                  </h3>
                  <p className="text-sm text-blue-700">
                    {editingRecordId ? 'Update maintenance record details' : 'Manual maintenance logging as per UC-005'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {!selectedVehicle && (
                <div>
                  <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700">
                    Vehicle *
                  </label>
                  <select
                    id="vehicleId"
                    value={maintenanceForm.vehicleId}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a vehicle</option>
                    {equipmentStatus?.vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleNumber} - {vehicle.type}
                      </option>
                    ))}
                  </select>
                  {equipmentStatus?.vehicles.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      No vehicles available. Please ensure vehicles are registered in the system.
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-400">
                    Available vehicles: {equipmentStatus?.vehicles.length || 0}
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="recordType" className="block text-sm font-medium text-gray-700">
                  Record Type *
                </label>
                <select
                  id="recordType"
                  value={maintenanceForm.recordType}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, recordType: e.target.value as any }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ROUTINE">Routine Maintenance</option>
                  <option value="CORRECTIVE">Corrective Maintenance</option>
                  <option value="EMERGENCY">Emergency Repair</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority *
                </label>
                <select
                  id="priority"
                  value={maintenanceForm.priority}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the maintenance issue or requirement"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setEditingRecordId(null);
                  setMaintenanceForm({
                    vehicleId: '',
                    recordType: 'ROUTINE',
                    description: '',
                    priority: 'MEDIUM'
                  });
                }}
                disabled={isCreatingRecord || isEditingRecord}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={editingRecordId ? handleUpdateMaintenanceRecord : submitMaintenanceRecord}
                disabled={(isCreatingRecord || isEditingRecord) || !maintenanceForm.vehicleId || !maintenanceForm.description.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {editingRecordId 
                  ? (isEditingRecord ? 'Updating...' : 'Update Record')
                  : (isCreatingRecord ? 'Creating...' : 'Create Record')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attractive Notification System */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className={`rounded-lg shadow-lg border-l-4 p-4 max-w-md w-full ${
            notification.type === 'success' ? 'bg-green-50 border-green-400' :
            notification.type === 'error' ? 'bg-red-50 border-red-400' :
            notification.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
            'bg-blue-50 border-blue-400'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {notification.type === 'warning' && (
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                {notification.type === 'info' && (
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 w-full">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' :
                  notification.type === 'error' ? 'text-red-800' :
                  notification.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {notification.title}
                </p>
                <p className={`text-sm mt-1 ${
                  notification.type === 'success' ? 'text-green-700' :
                  notification.type === 'error' ? 'text-red-700' :
                  notification.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className={`ml-4 inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  notification.type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                  notification.type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                  notification.type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' :
                  'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attractive Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all animate-scale-in">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50 rounded-t-lg">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-medium text-red-900">{confirmDialog.title}</h3>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700">{confirmDialog.message}</p>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
              <button
                onClick={confirmDialog.onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorEquipmentSection;