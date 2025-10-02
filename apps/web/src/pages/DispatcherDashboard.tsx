import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { GoogleMapsProvider } from "../contexts/GoogleMapsContext";
import IncidentQueue from "../components/dispatch/IncidentQueue";
import DispatchWorkspace from "../components/dispatch/DispatchWorkspace";
import { ResourceSuggestion } from "../utils/resourceMatrix";

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
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);

  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  const handleIncidentsUpdate = (incidents: Incident[]) => {
    setAllIncidents(incidents);
  };

  const handleAssignResources = (
    incident: Incident,
    suggestions: ResourceSuggestion[]
  ) => {
    // TODO: Implement resource assignment logic
    console.log(
      "Assigning resources to incident:",
      incident.incidentId,
      suggestions
    );

    // For now, just show the suggestions in console
    console.table(suggestions);

    // TODO: Navigate to resource assignment interface or show modal
    alert(
      `Resource assignment for ${incident.incidentId} - Check console for suggestions`
    );
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
            onIncidentsUpdate={handleIncidentsUpdate}
          />
        </div>

        {/* Right Panel - Incident Workspace */}
        <div className="flex-1 flex flex-col">
          <GoogleMapsProvider>
            <DispatchWorkspace
              incident={selectedIncident}
              allIncidents={allIncidents}
              onIncidentSelect={handleIncidentSelect}
              onAssignResources={handleAssignResources}
            />
          </GoogleMapsProvider>
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
