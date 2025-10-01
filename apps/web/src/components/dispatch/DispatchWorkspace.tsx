import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useGoogleMaps } from "../../contexts/GoogleMapsContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import {
  getResourceSuggestions,
  getEstimatedResponseTime,
  ResourceSuggestion,
} from "../../utils/resourceMatrix";

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
      coordinates: [number, number]; // [longitude, latitude]
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

interface DispatchWorkspaceProps {
  incident: Incident;
  onBackToQueue: () => void;
  onAssignResources: (
    incident: Incident,
    suggestions: ResourceSuggestion[]
  ) => void;
}

// Default center for Sri Lanka (Colombo)
const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 };

const DispatchWorkspace: React.FC<DispatchWorkspaceProps> = ({
  incident: initialIncident,
  onBackToQueue,
  onAssignResources,
}) => {
  const { isLoaded } = useGoogleMaps();
  const { subscribe, isConnected, isConnecting } = useWebSocket();
  const [incident, setIncident] = useState<Incident>(initialIncident);
  const [showResourceSuggestions, setShowResourceSuggestions] = useState(false);
  const [selectedInfoWindow, setSelectedInfoWindow] = useState<string | null>(
    null
  );
  const [newNote, setNewNote] = useState("");

  // Subscribe to real-time incident updates for this specific incident
  useEffect(() => {
    const unsubscribeUpdate = subscribe("incident_update", (data) => {
      if (data.incident._id === incident._id) {
        setIncident(data.incident);
        console.log(
          "📱 [DispatchWorkspace] Real-time incident update received:",
          data.incident.incidentId,
          "Status:",
          data.incident.status
        );
      }
    });

    // Also subscribe to incident deletion (in case this incident gets deleted)
    const unsubscribeDelete = subscribe("incident_deleted", (data) => {
      if (data.incidentId === incident._id) {
        console.log(
          "📱 [DispatchWorkspace] Incident deleted, returning to queue"
        );
        // Optionally navigate back to queue automatically
        // onBackToQueue();
      }
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeDelete();
    };
  }, [subscribe, incident._id, onBackToQueue]);

  // Update local incident state when prop changes (initial load or navigation)
  useEffect(() => {
    setIncident(initialIncident);
  }, [initialIncident]);

  // Calculate resource suggestions
  const resourceSuggestions = getResourceSuggestions(
    incident.incidentType,
    incident.incidentCategory,
    incident.severity
  );

  const estimatedResponseTime = getEstimatedResponseTime(
    incident.incidentType,
    incident.incidentCategory
  );

  // Map configuration
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: false,
  };

  // Get incident location for map center
  const incidentLocation = incident.location.coordinates
    ? {
        lat: incident.location.coordinates.coordinates[1],
        lng: incident.location.coordinates.coordinates[0],
      }
    : DEFAULT_CENTER;

  const handleAssignResources = () => {
    onAssignResources(incident, resourceSuggestions);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      // TODO: Implement API call to add note
      console.log("Adding note:", newNote);
      setNewNote("");
    }
  };

  // Severity color mapping
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-800 bg-red-100 border-red-200";
      case "high":
        return "text-orange-800 bg-orange-100 border-orange-200";
      case "medium":
        return "text-yellow-800 bg-yellow-100 border-yellow-200";
      case "low":
        return "text-green-800 bg-green-100 border-green-200";
      default:
        return "text-gray-800 bg-gray-100 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-800 bg-yellow-100";
      case "assigned":
        return "text-blue-800 bg-blue-100";
      case "en_route":
        return "text-purple-800 bg-purple-100";
      case "on_scene":
        return "text-orange-800 bg-orange-100";
      case "resolved":
        return "text-green-800 bg-green-100";
      case "cancelled":
        return "text-gray-800 bg-gray-100";
      default:
        return "text-gray-800 bg-gray-100";
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-600">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="font-medium">Loading Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToQueue}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Queue
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-semibold text-gray-900">
              {incident.incidentId}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(
                incident.severity
              )}`}
            >
              {incident.severity.toUpperCase()} PRIORITY
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                incident.status
              )}`}
            >
              {incident.status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              Created: {new Date(incident.createdAt).toLocaleString()}
            </span>

            {/* Real-time connection indicator */}
            <div className="flex items-center space-x-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? "bg-green-500 animate-pulse"
                    : isConnecting
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
              />
              <span
                className={
                  isConnected
                    ? "text-green-700"
                    : isConnecting
                    ? "text-amber-700"
                    : "text-red-700"
                }
              >
                {isConnected
                  ? "Live Updates"
                  : isConnecting
                  ? "Connecting..."
                  : "Disconnected"}
              </span>
            </div>

            {incident.status === "pending" && (
              <button
                onClick={() =>
                  setShowResourceSuggestions(!showResourceSuggestions)
                }
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Assign Resources
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resource Suggestions Panel */}
      {showResourceSuggestions && (
        <div className="flex-shrink-0 bg-blue-50 border-b border-blue-200 px-6 py-4">
          <div className="mb-3">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Recommended Resources
            </h3>
            <p className="text-sm text-blue-700">
              Based on incident type: <strong>{incident.incidentType}</strong> →{" "}
              <strong>{incident.incidentCategory}</strong>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {resourceSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 ${
                  suggestion.required
                    ? "border-red-300 bg-red-50"
                    : "border-blue-300 bg-blue-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {suggestion.vehicleType}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      suggestion.required
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {suggestion.required ? "Required" : "Optional"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              <span className="font-medium">Estimated Response Time:</span>{" "}
              {estimatedResponseTime} minutes
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowResourceSuggestions(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignResources}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Proceed with Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Incident Details */}
        <div className="w-96 flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Incident Information */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Incident Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Type & Category
                  </label>
                  <p className="text-gray-900">
                    {incident.incidentType} → {incident.incidentCategory}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <p className="text-gray-900">{incident.description}</p>
                </div>
              </div>
            </div>

            {/* Caller Information */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Caller Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Name
                  </label>
                  <p className="text-gray-900">{incident.callerInfo.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Contact Number
                  </label>
                  <p className="text-gray-900">
                    {incident.callerInfo.contactNumber}
                  </p>
                </div>
                {incident.callerInfo.alternateContact && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Alternate Contact
                    </label>
                    <p className="text-gray-900">
                      {incident.callerInfo.alternateContact}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Reporting Method
                  </label>
                  <p className="text-gray-900 capitalize">
                    {incident.callerInfo.reportingMethod.replace("_", " ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Location
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Address
                  </label>
                  <p className="text-gray-900">{incident.location.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    City, Province
                  </label>
                  <p className="text-gray-900">
                    {incident.location.city}, {incident.location.province}
                  </p>
                </div>
                {incident.location.landmarks && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Landmarks
                    </label>
                    <p className="text-gray-900">
                      {incident.location.landmarks}
                    </p>
                  </div>
                )}
                {incident.location.coordinates && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      GPS Coordinates
                    </label>
                    <p className="text-gray-900 font-mono text-sm">
                      {incident.location.coordinates.coordinates[1].toFixed(6)},{" "}
                      {incident.location.coordinates.coordinates[0].toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Resources */}
            {incident.assignedResources.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Assigned Resources
                </h3>
                <div className="space-y-2">
                  {incident.assignedResources.map((resource, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-gray-900">
                        Resource #{resource.resourceId.slice(-6)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          resource.status
                        )}`}
                      >
                        {resource.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>

              {/* Add Note */}
              <div className="mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this incident..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add Note
                </button>
              </div>

              {/* Existing Notes */}
              <div className="space-y-3">
                {incident.notes.length === 0 ? (
                  <p className="text-gray-500 text-sm">No notes yet</p>
                ) : (
                  incident.notes.map((note, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-200 pl-4 py-2"
                    >
                      <p className="text-gray-900">{note.note}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(note.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={incidentLocation}
            zoom={incident.location.coordinates ? 15 : 11}
            options={mapOptions}
          >
            {/* Incident Location Marker */}
            {incident.location.coordinates && (
              <Marker
                position={incidentLocation}
                icon={{
                  url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEQzI2MjYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyMkMxMiAyMiAxOSA2IDE5IDZMMTkgNi4wMDAwMUMxOSAzLjc5MDg2IDE3LjIwOTEgMiAxNSAySDlDNi43OTA4NiAyIDUgMy43OTA4NiA1IDZMMTIgMjJaIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9IndoaXRlIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cjwvc3ZnPgo=",
                  scaledSize: new google.maps.Size(32, 32),
                }}
                onClick={() => setSelectedInfoWindow("incident")}
              />
            )}

            {/* Info Window for Incident */}
            {selectedInfoWindow === "incident" &&
              incident.location.coordinates && (
                <InfoWindow
                  position={incidentLocation}
                  onCloseClick={() => setSelectedInfoWindow(null)}
                >
                  <div className="p-2 max-w-xs">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Incident #{incident.incidentId}
                    </h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Type:</strong> {incident.incidentType} →{" "}
                      {incident.incidentCategory}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Address:</strong> {incident.location.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Severity:</strong> {incident.severity}
                    </p>
                  </div>
                </InfoWindow>
              )}
          </GoogleMap>

          {/* Map Overlay - No Location */}
          {!incident.location.coordinates && (
            <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="text-4xl mb-2">📍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No GPS Coordinates
                </h3>
                <p className="text-sm text-gray-600">
                  This incident doesn't have precise GPS coordinates.
                  <br />
                  Showing general area for {incident.location.city},{" "}
                  {incident.location.province}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DispatchWorkspace;