import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  PhoneIcon,
  ClipboardDocumentListIcon,
  MicrophoneIcon,
  PlusIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import CreateIncidentModal from "../incidents/CreateIncidentModal";
import IncidentList from "../incidents/IncidentList";

const CallTakerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'new-call' | 'incidents'>('new-call');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleIncidentCreated = (incidentId: string) => {
    setShowCreateModal(false);
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('incidents');
    
    // Show success message
    alert(`Incident ${incidentId} created successfully!`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <PhoneIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Emergency Call Center
                </h1>
                <p className="text-sm text-gray-500">Call Taker Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('new-call')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'new-call'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PhoneIcon className="h-5 w-5 inline mr-2" />
              Answer Calls
            </button>
            
            <button
              onClick={() => setActiveTab('incidents')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'incidents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ListBulletIcon className="h-5 w-5 inline mr-2" />
              View Incidents
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'new-call' ? (
            /* New Call Tab */
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Emergency Call Actions
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex flex-col items-center p-6 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors group"
                  >
                    <PlusIcon className="h-12 w-12 text-green-600 group-hover:text-green-700" />
                    <span className="mt-2 text-sm font-medium text-green-600 group-hover:text-green-700">
                      Log New Emergency
                    </span>
                    <span className="mt-1 text-xs text-gray-500">
                      Create incident from call
                    </span>
                  </button>

                  <div className="flex flex-col items-center p-6 bg-blue-50 rounded-lg">
                    <ClipboardDocumentListIcon className="h-12 w-12 text-blue-600" />
                    <span className="mt-2 text-sm font-medium text-blue-600">
                      Quick Logging
                    </span>
                    <span className="mt-1 text-xs text-gray-500">
                      Structured intake forms
                    </span>
                  </div>

                  <div className="flex flex-col items-center p-6 bg-yellow-50 rounded-lg">
                    <MicrophoneIcon className="h-12 w-12 text-yellow-600" />
                    <span className="mt-2 text-sm font-medium text-yellow-600">
                      Radio Dispatch
                    </span>
                    <span className="mt-1 text-xs text-gray-500">
                      Coordinate with units
                    </span>
                  </div>
                </div>
              </div>

              {/* Call Taker Guidelines */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Call Taking Guidelines
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Priority Questions</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• What is your emergency?</li>
                      <li>• Where are you located?</li>
                      <li>• Are you safe right now?</li>
                      <li>• Do you need medical, fire, or police?</li>
                      <li>• How many people are involved?</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Location Verification</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Confirm the complete address</li>
                      <li>• Ask for nearby landmarks</li>
                      <li>• Verify access points</li>
                      <li>• Note any hazards or obstacles</li>
                      <li>• Use map verification when possible</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Incidents Tab */
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Recent Incidents
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Log New Call
                  </button>
                </div>
                
                <IncidentList 
                  refreshTrigger={refreshTrigger}
                  onViewIncident={(incident) => {
                    // TODO: Implement incident detail view
                    alert(`Viewing incident: ${incident.incidentId}`);
                  }}
                  onEditIncident={(incident) => {
                    // TODO: Implement incident editing
                    alert(`Editing incident: ${incident.incidentId}`);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleIncidentCreated}
      />
    </div>
  );
};

export default CallTakerDashboard;
