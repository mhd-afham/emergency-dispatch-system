import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { GoogleMapsProvider } from "../contexts/GoogleMapsContext";
import IncidentQueue from "../components/dispatch/IncidentQueue";
import DispatchWorkspace from "../components/dispatch/DispatchWorkspace";
import { ResourceSuggestion } from "../utils/resourceMatrix";
import { MdHistory } from "react-icons/md";

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
  const navigate = useNavigate();
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

  const handleAssignResources = async (
    incident: Incident,
    suggestions: ResourceSuggestion[]
  ) => {
    try {
      console.log(
        "📋 Assignment workflow initiated for incident:",
        incident.incidentId
      );
      console.log("💡 Suggested resources:", suggestions);

      // For now, automatically assign the first suggested vehicle
      // In a real implementation, you would show a modal to let dispatcher choose
      const primarySuggestion = suggestions.find((s) => s.required);

      if (!primarySuggestion) {
        alert("No required vehicles suggested for this incident type");
        return;
      }

      // Find an available vehicle of the suggested type
      // This is a simplified implementation - in production you would:
      // 1. Show a map with all available vehicles
      // 2. Let dispatcher manually select or confirm the suggested vehicle
      // 3. Display vehicle details, crew info, and ETA

      console.log(
        `🚗 Creating assignment for vehicle type: ${primarySuggestion.vehicleType}`
      );
      console.log(
        "⚠️ Note: This is a simplified implementation. In production, dispatcher would select specific vehicle from map."
      );

      // Make API call to create assignment
      // const token = localStorage.getItem("token");

      // For demo purposes, we'll need to get an actual available vehicle ID
      // In production, this would come from the vehicle selection UI
      alert(
        `Assignment workflow ready!\n\nIncident: ${incident.incidentId}\nSuggested: ${primarySuggestion.vehicleType}\n\n⚠️ Next step: Implement vehicle selection UI to choose specific vehicle and crew.\n\nAPI endpoint ready: POST /api/assignments\nRequired: vehicleId, primaryCrewId, incidentId`
      );

      console.log("✅ Assignment API endpoints are now available");
      console.log(
        "📱 Mobile app needed for crews to accept/decline assignments"
      );
    } catch (error) {
      console.error("❌ Error in assignment workflow:", error);
      alert(
        "Failed to initiate assignment workflow. Check console for details."
      );
    }
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
                onClick={() => navigate("/assignments/history")}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm hover:shadow"
              >
                <MdHistory className="text-lg" />
                Assignment History
              </button>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
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
