import React, { useState, useEffect } from 'react';
import { equipmentService } from '../../services/equipment';

interface EquipmentManagementDashboardProps {
  className?: string;
}

const EquipmentManagementDashboard: React.FC<EquipmentManagementDashboardProps> = ({ className = '' }) => {
  // State Management
  const [activeTab, setActiveTab] = useState<'maintenance' | 'checks'>('maintenance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Toast Notification State
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  // Summary Statistics
  const [statistics, setStatistics] = useState({
    totalChecks: 0,
    passedChecks: 0,
    criticalFailures: 0,
    minorIssues: 0,
    passRate: '0%',
  });

  // Maintenance Records
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicleId: '',
    recordType: 'ROUTINE' as 'ROUTINE' | 'CORRECTIVE' | 'EMERGENCY',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
  });

  // Equipment Checks
  const [equipmentChecks, setEquipmentChecks] = useState<any[]>([]);

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });

  useEffect(() => {
    loadDashboardData();
    loadVehicles();
  }, []);

  useEffect(() => {
    if (activeTab === 'maintenance') {
      loadMaintenanceRecords();
    } else if (activeTab === 'checks') {
      loadEquipmentChecks();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await equipmentService.getEquipmentStatistics('week');
      
      // Update statistics with real data from backend
      if (response && response.statistics) {
        setStatistics({
          totalChecks: response.statistics.totalChecks || 0,
          passedChecks: response.statistics.passedChecks || 0,
          criticalFailures: response.statistics.criticalFailures || 0,
          minorIssues: response.statistics.minorIssues || 0,
          passRate: response.statistics.passRate ? `${response.statistics.passRate}%` : '0%',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard load error:', err);
      // Set default values if loading fails
      setStatistics({
        totalChecks: 0,
        passedChecks: 0,
        criticalFailures: 0,
        minorIssues: 0,
        passRate: '0%',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const vehicleData = await equipmentService.getAllVehicles();
      setVehicles(vehicleData || []);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  };

  const loadMaintenanceRecords = async () => {
    try {
      const maintenanceData = await equipmentService.getAllMaintenanceRecords({ limit: 50 });
      setMaintenanceRecords(maintenanceData.maintenanceRecords || []);
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
    }
  };

  const loadEquipmentChecks = async () => {
    try {
      const checksData = await equipmentService.getAllEquipmentChecks({ page: 1, limit: 50 });
      setEquipmentChecks(checksData.equipmentChecks || []);
      
      // Also refresh statistics when equipment checks are loaded
      loadDashboardData();
    } catch (err) {
      console.error('Failed to load equipment checks:', err);
    }
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: 'info', message: '' }), 4000);
  };

  const handleCreateMaintenance = async () => {
    try {
      if (!maintenanceForm.vehicleId || !maintenanceForm.description) {
        showToast('warning', 'Please fill in all required fields');
        return;
      }

      await equipmentService.createMaintenanceRecord({
        ...maintenanceForm,
        createdBy: 'current-user',
      });
      
      setShowMaintenanceModal(false);
      setMaintenanceForm({
        vehicleId: '',
        recordType: 'ROUTINE',
        description: '',
        priority: 'MEDIUM',
      });
      loadMaintenanceRecords();
      showToast('success', 'Maintenance record created successfully!');
    } catch (err) {
      showToast('error', 'Failed to create maintenance record: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUpdateMaintenance = async (id: string) => {
    try {
      if (!maintenanceForm.vehicleId || !maintenanceForm.description) {
        showToast('warning', 'Please fill in all required fields');
        return;
      }

      await equipmentService.updateMaintenanceRecord(id, {
        ...maintenanceForm,
      });
      
      setShowMaintenanceModal(false);
      setEditingRecord(null);
      setMaintenanceForm({
        vehicleId: '',
        recordType: 'ROUTINE',
        description: '',
        priority: 'MEDIUM',
      });
      loadMaintenanceRecords();
      showToast('success', 'Maintenance record updated successfully!');
    } catch (err) {
      showToast('error', 'Failed to update maintenance record: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteMaintenance = async () => {
    if (!deleteConfirm.id) return;
    
    try {
      await equipmentService.deleteMaintenanceRecord(deleteConfirm.id);
      
      // Close confirmation dialog
      setDeleteConfirm({ show: false, id: null });
      
      // Immediately update the list by removing the deleted item
      setMaintenanceRecords(prevRecords => 
        prevRecords.filter(record => record._id !== deleteConfirm.id)
      );
      
      // Show success message
      showToast('success', 'Maintenance record deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('error', 'Failed to delete maintenance record: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'CANCELLED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header - Clean and Simple */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Equipment Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage vehicle readiness, maintenance records, and equipment inspections
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{statistics.totalChecks}</div>
            <div className="text-sm text-gray-600">Total Checks</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{statistics.passedChecks}</div>
            <div className="text-sm text-gray-600">Passed Checks</div>
            <div className="text-xs text-green-500 mt-1">{statistics.passRate}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{statistics.minorIssues}</div>
            <div className="text-sm text-gray-600">Minor Issues</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-red-600">{statistics.criticalFailures}</div>
            <div className="text-sm text-gray-600">Critical Failures</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - 2 Tabs Only */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'maintenance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔧 Maintenance Records
          </button>
          <button
            onClick={() => setActiveTab('checks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'checks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ✅ Equipment Checks
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">

        {/* Maintenance Records Tab */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Maintenance Records</h3>
              <button
                onClick={() => {
                  setEditingRecord(null);
                  setShowMaintenanceModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                + New Maintenance Record
              </button>
            </div>

            {maintenanceRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">🔧</div>
                <p className="text-xl mb-2 font-medium">No maintenance records found</p>
                <p className="text-sm">Create a new maintenance record to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Vehicle</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Priority</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {maintenanceRecords.map((record: any) => (
                      <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {record.vehicleId?.registration?.plateNumber || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.recordType}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {record.description}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(record.priority)}`}>
                            {record.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingRecord(record);
                                setMaintenanceForm({
                                  vehicleId: record.vehicleId?._id || '',
                                  recordType: record.recordType,
                                  description: record.description,
                                  priority: record.priority,
                                });
                                setShowMaintenanceModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ show: true, id: record._id })}
                              className="text-red-600 hover:text-red-900 text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Equipment Checks Tab */}
        {activeTab === 'checks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Equipment Checks</h3>
              <p className="text-sm text-gray-500">Equipment checks are created from the mobile app</p>
            </div>

            {equipmentChecks.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-xl mb-2 font-medium">No equipment checks found</p>
                <p className="text-sm">Perform a new equipment check to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Vehicle</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Inspector</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Results</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {equipmentChecks.map((check: any) => (
                      <tr key={check._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-gray-900">
                            {check.vehicleId?.registration?.plateNumber || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {check.vehicleId?.type}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {check.crewId?.personal?.firstName} {check.crewId?.personal?.lastName}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            check.inspection?.overallStatus === 'passed' ? 'text-green-600 bg-green-100' :
                            check.inspection?.overallStatus === 'minor_issues' ? 'text-yellow-600 bg-yellow-100' :
                            'text-red-600 bg-red-100'
                          }`}>
                            {check.inspection?.overallStatus?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-green-600">✓ {check.inspection?.passCount}</span>
                          {check.inspection?.failCount > 0 && (
                            <span className="text-red-600 ml-2">✗ {check.inspection?.failCount}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(check.audit?.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRecord ? 'Edit Maintenance Record' : 'New Maintenance Record'}
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle <span className="text-red-500">*</span>
                </label>
                <select
                  value={maintenanceForm.vehicleId}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vehicleId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} - {vehicle.vehicleType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Record Type
                </label>
                <select
                  value={maintenanceForm.recordType}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, recordType: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ROUTINE">ROUTINE</option>
                  <option value="CORRECTIVE">CORRECTIVE</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={maintenanceForm.priority}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Describe the maintenance work required..."
                  required
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setEditingRecord(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingRecord) {
                    handleUpdateMaintenance(editingRecord._id);
                  } else {
                    handleCreateMaintenance();
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingRecord ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.96-1.333-2.73 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Confirm Delete
              </h3>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700">
                Are you sure you want to delete this maintenance record? This action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMaintenance}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className={`rounded-lg shadow-lg p-4 max-w-md flex items-start ${
            toast.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
            toast.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
            toast.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
            'bg-blue-50 border-l-4 border-blue-500'
          }`}>
            <div className="flex-shrink-0">
              {toast.type === 'success' && (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.96-1.333-2.73 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${
                toast.type === 'success' ? 'text-green-800' :
                toast.type === 'error' ? 'text-red-800' :
                toast.type === 'warning' ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast({ show: false, type: 'info', message: '' })}
              className="ml-4 flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagementDashboard;
