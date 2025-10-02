import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import SupervisorEquipmentSection from "../components/supervisor/SupervisorEquipmentSection";
import SupervisorShiftSection from "../components/supervisor/SupervisorShiftSection";

/**
 * Modular Supervisor Dashboard
 * 
 * This dashboard uses a component-based architecture to prevent merge conflicts
 * between team members working on different functional areas:
 * 
 * - Udayanga: Equipment Management (SupervisorEquipmentSection)
 * - Spencer: Shift Management (SupervisorShiftSection)
 * 
 * Each team member owns their section component and can develop independently.
 */

const ModularSupervisorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'equipment' | 'shifts'>('overview');
  
  // Analytics summary data
  const [analyticsSummary] = useState([
    {
      title: "Total Incidents Today",
      value: "47",
      icon: "🚨",
      status: "normal",
    },
    {
      title: "Average Response Time",
      value: "8.5 minutes",
      icon: "⏱️",
      status: "good",
    },
    {
      title: "Active Units",
      value: "12/18",
      icon: "🚑",
      status: "good",
    },
    {
      title: "Resolution Rate",
      value: "94%",
      icon: "✅",
      status: "excellent",
    },
  ]);



  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600 bg-green-50";
      case "good":
        return "text-blue-600 bg-blue-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
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
                Supervisor Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
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
      </nav>

      {/* Section Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Sections">
            <button
              onClick={() => setActiveSection('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveSection('equipment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'equipment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔧 Equipment Management
            </button>
            <button
              onClick={() => setActiveSection('shifts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'shifts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📅 Shift Management
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <>
            {/* Analytics Summary */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                  Analytics Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {analyticsSummary.map((item, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-xl border-2 ${getStatusColor(item.status)} hover:shadow-lg transition-shadow`}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">{item.icon}</div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">
                          {item.title}
                        </h4>
                        <p className="text-3xl font-bold text-gray-900">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Equipment Management Section */}
        {activeSection === 'equipment' && (
          <SupervisorEquipmentSection />
        )}

        {/* Shift Management Section */}
        {activeSection === 'shifts' && (
          <SupervisorShiftSection />
        )}
      </div>
    </div>
  );
};

export default ModularSupervisorDashboard;