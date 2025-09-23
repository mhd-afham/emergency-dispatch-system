import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const DispatcherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeIncidents, setActiveIncidents] = useState([
    {
      id: "INC-2024-001",
      type: "Medical Emergency",
      priority: "High",
      location: "123 Main St, Colombo",
      status: "Dispatched",
      assignedUnits: ["AMB-01", "FIRE-03"],
      reportedAt: "2024-01-15 14:30",
    },
    {
      id: "INC-2024-002",
      type: "Fire",
      priority: "Critical",
      location: "456 Park Ave, Kandy",
      status: "En Route",
      assignedUnits: ["FIRE-01", "FIRE-02", "AMB-02"],
      reportedAt: "2024-01-15 14:45",
    },
  ]);

  const [availableUnits, setAvailableUnits] = useState([
    {
      id: "AMB-03",
      type: "Ambulance",
      status: "Available",
      location: "Station 1",
    },
    {
      id: "FIRE-04",
      type: "Fire Truck",
      status: "Available",
      location: "Station 2",
    },
    {
      id: "POLICE-01",
      type: "Police Unit",
      status: "Available",
      location: "Station 3",
    },
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "High":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Dispatched":
        return "text-blue-600 bg-blue-50";
      case "En Route":
        return "text-yellow-600 bg-yellow-50";
      case "On Scene":
        return "text-green-600 bg-green-50";
      case "Available":
        return "text-green-600 bg-green-50";
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
                Dispatcher Dashboard
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
              Emergency Dispatch Control
            </h1>
            <p className="text-gray-600 mt-2">
              Resource allocation, incident monitoring, and crew coordination
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Incidents
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {activeIncidents.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Available Units
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {availableUnits.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">→</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        En Route
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">3</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">⏱</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Avg Response Time
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        4.2 min
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Active Incidents */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Active Incidents
                  </h3>
                  <div className="space-y-4">
                    {activeIncidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {incident.id}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                                  incident.priority
                                )}`}
                              >
                                {incident.priority}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                  incident.status
                                )}`}
                              >
                                {incident.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {incident.type}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              📍 {incident.location}
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="mr-4">
                                Reported: {incident.reportedAt}
                              </span>
                              <span>
                                Units: {incident.assignedUnits.join(", ")}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              View Details
                            </button>
                            <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                              Assign Units
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Available Units */}
            <div>
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Available Units
                  </h3>
                  <div className="space-y-3">
                    {availableUnits.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {unit.id}
                          </div>
                          <div className="text-xs text-gray-500">
                            {unit.type} • {unit.location}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            unit.status
                          )}`}
                        >
                          {unit.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                    View All Units
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white shadow rounded-lg mt-6">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">
                      Create Emergency Incident
                    </button>
                    <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700">
                      Dispatch Available Unit
                    </button>
                    <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                      Mark Unit Available
                    </button>
                    <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                      Generate Reports
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

export default DispatcherDashboard;
