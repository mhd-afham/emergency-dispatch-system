import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { equipmentService } from '../services/equipment';
import SupervisorEquipmentSection from '../components/SupervisorEquipmentSection';
import MaintenanceRecordSearch from '../components/MaintenanceRecordSearch';

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

interface NewMaintenanceRecord {
  vehicleId: string;
  recordType: 'ROUTINE' | 'CORRECTIVE' | 'EMERGENCY';
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

const EquipmentManagementPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'search'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState<NewMaintenanceRecord>({
    vehicleId: '',
    recordType: 'ROUTINE',
    description: '',
    priority: 'MEDIUM'
  });

  const handleCreateMaintenanceRecord = async () => {
    if (!newRecord.vehicleId || !newRecord.description.trim()) {
      setCreateError('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      
      // Create maintenance record via API
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/equipment/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newRecord,
          createdBy: user?.email || 'Unknown'
        })
      });

      // Reset form and close modal
      setNewRecord({
        vehicleId: '',
        recordType: 'ROUTINE',
        description: '',
        priority: 'MEDIUM'
      });
      setShowCreateModal(false);
      
      // Refresh the equipment section data
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to create maintenance record:', error);
      setCreateError('Failed to create maintenance record. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img
                src="/images/respondr-horizontal.svg"
                alt="Respondr"
                className="h-8 w-auto"
              />
              <span className="ml-2 text-xl font-semibold text-gray-900">
                Equipment Management
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={() => window.history.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </button>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                UC-005 Digital Equipment Readiness System - Monitor vehicle readiness, manage equipment checks, and track maintenance status
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                + Create Maintenance Record
              </button>
              <button
                onClick={() => window.location.href = '/equipment'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                New Equipment Check
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Equipment Overview
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'maintenance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔧 Maintenance Management
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔍 Search & Reports
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Equipment Overview Tab */}
        {activeTab === 'overview' && (
          <SupervisorEquipmentSection />
        )}

        {/* Maintenance Management Tab */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            {/* Maintenance Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Workflow Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-center"
                >
                  <div className="text-gray-400 text-3xl mb-2">📝</div>
                  <div className="text-sm font-medium text-gray-900">Create Maintenance Record</div>
                  <div className="text-xs text-gray-500">Manual maintenance logging</div>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-center">
                  <div className="text-gray-400 text-3xl mb-2">🔍</div>
                  <div className="text-sm font-medium text-gray-900">Schedule Inspection</div>
                  <div className="text-xs text-gray-500">Plan upcoming checks</div>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-center">
                  <div className="text-gray-400 text-3xl mb-2">📊</div>
                  <div className="text-sm font-medium text-gray-900">Generate Reports</div>
                  <div className="text-xs text-gray-500">Maintenance analytics</div>
                </button>
              </div>
            </div>

            {/* UC-005 Compliance Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-blue-900 mb-3">UC-005 Compliance Requirements</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start">
                  <div className="text-blue-600 mr-2">✓</div>
                  <div>Digital equipment readiness tracking with real-time status updates</div>
                </div>
                <div className="flex items-start">
                  <div className="text-blue-600 mr-2">✓</div>
                  <div>Automated maintenance workflow with supervisor approval system</div>
                </div>
                <div className="flex items-start">
                  <div className="text-blue-600 mr-2">✓</div>
                  <div>Equipment status classification: READY, AVAILABLE_WITH_RESTRICTIONS, OUT_OF_SERVICE, PENDING_INSPECTION</div>
                </div>
                <div className="flex items-start">
                  <div className="text-blue-600 mr-2">✓</div>
                  <div>Manual maintenance record creation for issues not caught by automated checks</div>
                </div>
                <div className="flex items-start">
                  <div className="text-blue-600 mr-2">✓</div>
                  <div>Integration with vehicle dispatch system for equipment availability</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Reports Tab */}
        {activeTab === 'search' && (
          <MaintenanceRecordSearch />
        )}
      </div>

      {/* Create Maintenance Record Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create Maintenance Record</h3>
              <p className="text-sm text-gray-500">Manual maintenance logging as per UC-005</p>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="text-red-800 text-sm">{createError}</div>
                </div>
              )}

              <div>
                <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700">
                  Vehicle ID *
                </label>
                <input
                  type="text"
                  id="vehicleId"
                  value={newRecord.vehicleId}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, vehicleId: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter vehicle ID"
                />
              </div>

              <div>
                <label htmlFor="recordType" className="block text-sm font-medium text-gray-700">
                  Record Type *
                </label>
                <select
                  id="recordType"
                  value={newRecord.recordType}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, recordType: e.target.value as any }))}
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
                  value={newRecord.priority}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, priority: e.target.value as any }))}
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
                  value={newRecord.description}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the maintenance issue or requirement"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMaintenanceRecord}
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagementPage;