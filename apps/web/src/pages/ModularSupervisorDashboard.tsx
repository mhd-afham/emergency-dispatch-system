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
  
  // Core supervisor data (owned by main dashboard)
  const [pendingApprovals] = useState([
    {
      id: "APPR-001",
      type: "Vehicle Registration",
      item: "AMB-05 - New Ambulance",
      requestedBy: "John Smith",
      department: "Medical Services",
      requestedAt: "2024-01-15 09:30",
      priority: "Medium",
    },
    {
      id: "APPR-002",
      type: "Crew Assignment",
      item: "Night Shift - Station 2",
      requestedBy: "Sarah Johnson",
      department: "Operations",
      requestedAt: "2024-01-15 11:45",
      priority: "High",
    },
  ]);

  const [performanceMetrics] = useState([
    {
      metric: "Response Time (Avg)",
      value: "4.2 min",
      trend: "↓",
      status: "good",
    },
    {
      metric: "Incident Resolution",
      value: "92%",
      trend: "↑",
      status: "excellent",
    },
    { metric: "Unit Availability", value: "85%", trend: "→", status: "good" },
    {
      metric: "Call Volume (Today)",
      value: "47",
      trend: "↑",
      status: "normal",
    },
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600 bg-red-50 border-red-200";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

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
            {/* Performance Metrics Overview */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Performance Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {performanceMetrics.map((metric, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getStatusColor(metric.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{metric.metric}</p>
                          <p className="text-2xl font-bold">{metric.value}</p>
                        </div>
                        <span className="text-2xl" role="img" aria-label="trend">
                          {metric.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Pending Approvals
                </h3>
                <div className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {approval.id}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                                approval.priority
                              )}`}
                            >
                              {approval.priority}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {approval.type}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {approval.item}
                          </p>
                          <div className="text-xs text-gray-500">
                            Requested by {approval.requestedBy} • {approval.department} • {approval.requestedAt}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                            Approve
                          </button>
                          <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">System Management</h4>
                <div className="space-y-3">
                  <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">
                    Emergency Overrides
                  </button>
                  <button className="w-full bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700">
                    Vehicle Approvals
                  </button>
                  <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                    Budget Approvals
                  </button>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Reports & Analytics</h4>
                <div className="space-y-3">
                  <button className="w-full bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700">
                    Performance Reports
                  </button>
                  <button className="w-full bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-cyan-700">
                    Resource Analytics
                  </button>
                  <button className="w-full bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-700">
                    System Health
                  </button>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Communication</h4>
                <div className="space-y-3">
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                    Broadcast Message
                  </button>
                  <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700">
                    Team Notifications
                  </button>
                  <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                    Status Updates
                  </button>
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