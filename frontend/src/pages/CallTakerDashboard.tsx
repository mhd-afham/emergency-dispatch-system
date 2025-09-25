import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import IncidentForm from "../components/incident/IncidentForm";
import IncidentList from "../components/incident/IncidentList";

const CallTakerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleIncidentSuccess = (result: any) => {
    console.log('Incident created successfully:', result);
    setShowIncidentForm(false);
    setRefreshTrigger(prev => prev + 1); // Trigger list refresh
    // The success notification is now handled by the IncidentForm component
  };

  const handleIncidentUpdate = () => {
    setRefreshTrigger(prev => prev + 1); // Trigger list refresh
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
                Emergency Dispatch System
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Call Taker Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Log emergency incidents and manage all reported cases
            </p>
          </div>

          {/* Incident Intake Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowIncidentForm(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Log New Emergency Incident
            </button>
          </div>

          {/* Incident List */}
          <div className="space-y-6">
            <IncidentList 
              key={refreshTrigger} 
              onIncidentUpdate={handleIncidentUpdate}
            />
          </div>

          {/* Incident Form Modal */}
          {showIncidentForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-8 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Emergency Incident Intake</h3>
                  <button
                    onClick={() => setShowIncidentForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <IncidentForm
                  onSuccess={handleIncidentSuccess}
                  onCancel={() => setShowIncidentForm(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallTakerDashboard;
