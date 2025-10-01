import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import IncidentQueue from "../components/incident/IncidentQueue";

interface Incident {
  _id: string;
  incidentId: string;
  callerInfo: {
    name: string;
    contactNumber: string;
    alternateContact?: string;
    reportingMethod:
      | "phone_call"
      | "mobile_app"
      | "sms"
      | "walk_in"
      | "third_party";
  };
  incidentType: "medical" | "fire" | "rescue" | "hazmat" | "traffic" | "other";
  incidentCategory: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location: {
    address: string;
    city: string;
    province: string;
    coordinates?: {
      type: "Point";
      coordinates: [number, number];
    };
    locationAccuracy?: "exact" | "approximate" | "general_area";
    landmarks?: string;
  };
  status:
    | "pending"
    | "assigned"
    | "en_route"
    | "on_scene"
    | "resolved"
    | "cancelled";
  assignedResources: Array<{
    resourceId: string;
    assignedAt: string;
    status: "assigned" | "en_route" | "on_scene" | "completed";
  }>;
  assignedDispatcher?: string;
  createdAt: string;
  updatedAt: string;
  notes: Array<{
    note: string;
    addedBy: string;
    timestamp: string;
  }>;
}

const DispatcherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );

  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Main Content - Incident-Centric Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Incident Queue */}
        <div className="w-96 bg-white border-r flex-shrink-0">
          <IncidentQueue
            onIncidentSelect={handleIncidentSelect}
            selectedIncidentId={selectedIncident?._id}
          />
        </div>

        {/* Right Panel - Incident Workspace */}
        <div className="flex-1 flex flex-col">
          {selectedIncident ? (
            <div className="h-full">
              {/* Incident Header */}
              <div className="bg-white border-b p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold text-gray-900">
                      Incident #{selectedIncident.incidentId}
                    </h1>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        {
                          critical: "bg-red-100 text-red-800",
                          high: "bg-orange-100 text-orange-800",
                          medium: "bg-yellow-100 text-yellow-800",
                          low: "bg-green-100 text-green-800",
                        }[selectedIncident.severity]
                      }`}
                    >
                      {selectedIncident.severity.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Created:{" "}
                    {new Date(selectedIncident.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {/* Incident Details Placeholder */}
              <div className="flex-1 p-6 bg-gray-50">
                <div className="text-center text-gray-500">
                  <div className="text-2xl mb-2">🔧</div>
                  <p className="text-sm">
                    Incident workspace under construction
                  </p>
                  <p className="text-xs">
                    Details, map, and communications coming soon
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* No Incident Selected State */
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">
                  Select an Incident
                </h2>
                <p className="text-sm text-gray-600">
                  Choose an incident from the queue to view details and manage
                  resources
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
