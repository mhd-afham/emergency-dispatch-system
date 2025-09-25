import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const SupervisorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([
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

  const [shiftOverview, setShiftOverview] = useState({
    currentShift: "Day Shift (06:00 - 18:00)",
    totalStaff: 24,
    onDuty: 22,
    onBreak: 2,
    nextShift: "Night Shift (18:00 - 06:00)",
    nextShiftStaff: 18,
  });

  const [performanceMetrics, setPerformanceMetrics] = useState([
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
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Operations Management
            </h1>
            <p className="text-gray-600 mt-2">
              Shift planning, crew assignment, approvals, and performance
              monitoring
            </p>
          </div>

          {/* Shift Overview */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Current Shift Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {shiftOverview.onDuty}
                  </div>
                  <div className="text-sm text-gray-600">Staff On Duty</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {shiftOverview.totalStaff}
                  </div>
                  <div className="text-sm text-gray-600">Total Scheduled</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {shiftOverview.onBreak}
                  </div>
                  <div className="text-sm text-gray-600">On Break</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {shiftOverview.nextShiftStaff}
                  </div>
                  <div className="text-sm text-gray-600">Next Shift Ready</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>Current: {shiftOverview.currentShift}</p>
                <p>Upcoming: {shiftOverview.nextShift}</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pending Approvals */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
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
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="mr-4">
                                Requested by: {approval.requestedBy}
                              </span>
                              <span className="mr-4">
                                Dept: {approval.department}
                              </span>
                              <span>{approval.requestedAt}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                              Approve
                            </button>
                            <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                              Reject
                            </button>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              Review
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                    View All Pending Approvals
                  </button>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white shadow rounded-lg mt-6">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {performanceMetrics.map((metric, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {metric.metric}
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {metric.value}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{metric.trend}</span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              metric.status
                            )}`}
                          >
                            {metric.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Management */}
            <div>
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Shift Management
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                      Manage Shift Schedule
                    </button>
                    <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                      Assign Crews
                    </button>
                    <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700">
                      Break Management
                    </button>
                    <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700">
                      Staff Performance
                    </button>
                  </div>
                </div>
              </div>

              {/* Approvals Quick Actions */}
              <div className="bg-white shadow rounded-lg mt-6">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Approval Actions
                  </h3>
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
                    <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                      Policy Updates
                    </button>
                  </div>
                </div>
              </div>

              {/* Reports */}
              <div className="bg-white shadow rounded-lg mt-6">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Reports & Analytics
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700">
                      Shift Summary Report
                    </button>
                    <button className="w-full bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-cyan-700">
                      Performance Analytics
                    </button>
                    <button className="w-full bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-700">
                      Resource Utilization
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
