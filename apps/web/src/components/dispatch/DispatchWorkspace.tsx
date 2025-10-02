import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useGoogleMaps } from "../../contexts/GoogleMapsContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import {
  getResourceSuggestions,
  getEstimatedResponseTime,
  ResourceSuggestion,
} from "../../utils/resourceMatrix";
import {
  Vehicle,
  generateVehicleMarkerSVG,
  generateIncidentMarkerSVG,
  getVehicleStatusColors,
  getIncidentStatusColors,
  getVehicleTypeIcon,
} from "../../utils/vehicleUtils";

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
  incident: Incident | null;
  allIncidents?: Incident[]; // Add all incidents for map display
  onIncidentSelect?: (incident: Incident) => void;
  onAssignResources: (
    incident: Incident,
    suggestions: ResourceSuggestion[]
  ) => void;
}

// Default center for Sri Lanka (Colombo)
const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 };

const DispatchWorkspace: React.FC<DispatchWorkspaceProps> = ({
  incident: initialIncident,
  allIncidents = [],
  onIncidentSelect,
  onAssignResources,
}) => {
  const { isLoaded } = useGoogleMaps();
  const { subscribe, isConnected, isConnecting } = useWebSocket();
  const [incident, setIncident] = useState<Incident | null>(initialIncident);
  const [showResourceSuggestions, setShowResourceSuggestions] = useState(false);
  const [selectedInfoWindow, setSelectedInfoWindow] = useState<string | null>(
    null
  );
  const [newNote, setNewNote] = useState("");

  // Phase 3: Vehicle tracking state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Fetch vehicles from backend
  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/vehicles", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setVehicles(result.data);
        console.log(`✅ Fetched ${result.data.length} vehicles successfully`);
      } else {
        console.error("API returned unsuccessful response:", result);
        setVehicles([]);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      // For now, use empty array - will be replaced with backend integration
      setVehicles([]);
    }
  };

  // Subscribe to real-time incident updates for this specific incident
  useEffect(() => {
    if (!incident) return;

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
        console.log("📱 [DispatchWorkspace] Incident deleted");
        // Note: No need to navigate back as queue is always visible
      }
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeDelete();
    };
  }, [subscribe, incident]);

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Phase 3: Subscribe to vehicle location updates
  useEffect(() => {
    const unsubscribeVehicleUpdate = subscribe(
      "vehicle_location_update",
      (data) => {
        console.log("📍 [DispatchWorkspace] Vehicle location update:", data);
        setVehicles((prev) =>
          prev.map((vehicle) =>
            vehicle._id === data.vehicleId
              ? {
                  ...vehicle,
                  status: {
                    ...vehicle.status,
                    currentLocation: data.location,
                    lastLocationUpdate: new Date().toISOString(),
                  },
                }
              : vehicle
          )
        );
      }
    );

    const unsubscribeVehicleStatus = subscribe(
      "vehicle_status_update",
      (data) => {
        console.log("🚗 [DispatchWorkspace] Vehicle status update:", data);
        setVehicles((prev) =>
          prev.map((vehicle) =>
            vehicle._id === data.vehicleId
              ? {
                  ...vehicle,
                  status: {
                    ...vehicle.status,
                    currentStatus: data.status,
                  },
                  assignment: data.assignedIncidentId
                    ? {
                        ...vehicle.assignment,
                        assignedIncidentId: data.assignedIncidentId,
                      }
                    : vehicle.assignment,
                }
              : vehicle
          )
        );
      }
    );

    return () => {
      unsubscribeVehicleUpdate();
      unsubscribeVehicleStatus();
    };
  }, [subscribe]);

  // Update local incident state when prop changes (initial load or navigation)
  useEffect(() => {
    setIncident(initialIncident);
    // Note: Map center and zoom should not change when incident selection changes
  }, [initialIncident]);

  // Smart map centering - center on incident marker only if it's out of view
  useEffect(() => {
    if (
      initialIncident &&
      mapRef.current &&
      initialIncident.location.coordinates
    ) {
      const incidentLat = initialIncident.location.coordinates.coordinates[1];
      const incidentLng = initialIncident.location.coordinates.coordinates[0];

      // Get current map bounds
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        const incidentPosition = new google.maps.LatLng(
          incidentLat,
          incidentLng
        );

        // Check if incident marker is within visible bounds
        if (!bounds.contains(incidentPosition)) {
          // Marker is out of view, center the map on it
          setMapCenter({ lat: incidentLat, lng: incidentLng });
          console.log(
            "🗺️ Centering map on out-of-view incident:",
            initialIncident.incidentId
          );
        }
      }
    }
  }, [initialIncident]);

  // Calculate resource suggestions - only if incident exists
  const resourceSuggestions = incident
    ? getResourceSuggestions(
        incident.incidentType,
        incident.incidentCategory,
        incident.severity
      )
    : [];

  const estimatedResponseTime = incident
    ? getEstimatedResponseTime(incident.incidentType, incident.incidentCategory)
    : 0;

  // Map configuration
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: false,
  };

  const handleAssignResources = () => {
    if (incident) {
      onAssignResources(incident, resourceSuggestions);
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      // TODO: Implement API call to add note
      console.log("Adding note:", newNote);
      setNewNote("");
    }
  };

  // Handle incident selection from map
  const handleIncidentMapClick = (clickedIncident: Incident) => {
    if (onIncidentSelect) {
      onIncidentSelect(clickedIncident);
    }
  };

  // Handle map click to close vehicle info windows
  const handleMapClick = () => {
    setSelectedInfoWindow(null);
    setSelectedVehicle(null);
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
      {/* Header - Only show when incident is selected */}
      {incident && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
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
      )}

      {/* Resource Suggestions Panel */}
      {incident && showResourceSuggestions && (
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
        {/* Left Panel - Incident Details or Placeholder */}
        <div className="w-72 flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          {incident ? (
            <div className="p-4 space-y-4">
              {/* Incident Information */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  Incident Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Type & Category
                    </label>
                    <p className="text-sm text-gray-900">
                      {incident.incidentType} → {incident.incidentCategory}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Description
                    </label>
                    <p className="text-sm text-gray-900">
                      {incident.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Caller Information */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  Caller Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Name
                    </label>
                    <p className="text-sm text-gray-900">
                      {incident.callerInfo.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Contact Number
                    </label>
                    <p className="text-sm text-gray-900">
                      {incident.callerInfo.contactNumber}
                    </p>
                  </div>
                  {incident.callerInfo.alternateContact && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Alternate Contact
                      </label>
                      <p className="text-sm text-gray-900">
                        {incident.callerInfo.alternateContact}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Reporting Method
                    </label>
                    <p className="text-sm text-gray-900 capitalize">
                      {incident.callerInfo.reportingMethod.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  Location
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Address
                    </label>
                    <p className="text-sm text-gray-900">
                      {incident.location.address}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      City, Province
                    </label>
                    <p className="text-sm text-gray-900">
                      {incident.location.city}, {incident.location.province}
                    </p>
                  </div>
                  {incident.location.landmarks && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Landmarks
                      </label>
                      <p className="text-sm text-gray-900">
                        {incident.location.landmarks}
                      </p>
                    </div>
                  )}
                  {incident.location.coordinates && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        GPS Coordinates
                      </label>
                      <p className="text-sm text-gray-900 font-mono text-xs">
                        {incident.location.coordinates.coordinates[1].toFixed(
                          6
                        )}
                        ,{" "}
                        {incident.location.coordinates.coordinates[0].toFixed(
                          6
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Resources */}
              {incident.assignedResources.length > 0 && (
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <h3 className="text-base font-medium text-gray-900 mb-2">
                    Assigned Resources
                  </h3>
                  <div className="space-y-1">
                    {incident.assignedResources.map((resource, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
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
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  Notes
                </h3>

                {/* Add Note */}
                <div className="mb-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about this incident..."
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="mt-1 bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Note
                  </button>
                </div>

                {/* Existing Notes */}
                <div className="space-y-2">
                  {incident.notes.length === 0 ? (
                    <p className="text-gray-500 text-xs">No notes yet</p>
                  ) : (
                    incident.notes.map((note, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-blue-200 pl-3 py-1"
                      >
                        <p className="text-sm text-gray-900">{note.note}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(note.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* No Incident Selected State */
            <div className="h-full flex items-center justify-center">
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

        {/* Right Panel - Map */}
        <div className="flex-1 relative">
          {/* Simplified Map Controls */}
          <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-3 min-w-[180px]">
            <div className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Emergency Vehicles ({vehicles.length})
            </div>

            {/* Vehicle Types with counts */}
            <div className="space-y-2">
              {[
                {
                  type: "Ambulance",
                  count: vehicles.filter(
                    (v) => v.registration.vehicleType === "Ambulance"
                  ).length,
                },
                {
                  type: "Fire Engine",
                  count: vehicles.filter(
                    (v) => v.registration.vehicleType === "Fire Engine"
                  ).length,
                },
                {
                  type: "Rescue Vehicle",
                  count: vehicles.filter(
                    (v) => v.registration.vehicleType === "Rescue Vehicle"
                  ).length,
                },
                {
                  type: "Support Vehicle",
                  count: vehicles.filter(
                    (v) => v.registration.vehicleType === "Support Vehicle"
                  ).length,
                },
              ]
                .filter(({ count }) => count > 0)
                .map(({ type, count }) => (
                  <div
                    key={type}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700">{type}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
            </div>

            {/* Vehicle Status Summary */}
            <div className="border-t border-gray-200 pt-3">
              <div className="text-xs font-medium text-gray-700 mb-2">
                Status
              </div>
              <div className="space-y-1">
                {[
                  { status: "available", label: "Available", color: "#059669" },
                  { status: "assigned", label: "Assigned", color: "#d97706" },
                  { status: "en_route", label: "En Route", color: "#dc2626" },
                  { status: "on_scene", label: "On Scene", color: "#7c3aed" },
                ].map(({ status, label, color }) => {
                  const count = vehicles.filter(
                    (v) => v.status.currentStatus === status
                  ).length;
                  return count > 0 ? (
                    <div
                      key={status}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-gray-600">{label}</span>
                      </div>
                      <span className="font-medium text-gray-800">{count}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={mapCenter}
            zoom={12}
            options={mapOptions}
            onClick={handleMapClick}
            onLoad={(map) => {
              mapRef.current = map;
            }}
          >
            {/* All Active Incidents Markers */}
            {allIncidents
              .filter(
                (inc) =>
                  inc.status !== "resolved" &&
                  inc.status !== "cancelled" &&
                  inc.location.coordinates
              )
              .map((incidentItem) => {
                const incLocation = {
                  lat: incidentItem.location.coordinates!.coordinates[1],
                  lng: incidentItem.location.coordinates!.coordinates[0],
                };
                const isSelected = incidentItem._id === incident?._id;

                return (
                  <Marker
                    key={incidentItem._id}
                    position={incLocation}
                    icon={{
                      url: generateIncidentMarkerSVG(
                        incidentItem.status,
                        incidentItem.severity,
                        isSelected // Highlight only selected incident
                      ),
                      scaledSize: new google.maps.Size(
                        isSelected ? 40 : 30,
                        isSelected ? 40 : 30
                      ),
                    }}
                    onClick={() => {
                      if (!isSelected) {
                        // Select this incident without showing InfoWindow
                        handleIncidentMapClick(incidentItem);
                      }
                    }}
                    zIndex={isSelected ? 1000 : 800}
                  />
                );
              })}

            {/* Phase 3: All Vehicles on Map */}
            {vehicles.map((vehicle) => {
              const vehiclePosition = {
                lat: vehicle.status.currentLocation.coordinates[1],
                lng: vehicle.status.currentLocation.coordinates[0],
              };

              const isSelectedVehicle = selectedVehicle?._id === vehicle._id;
              const isAssignedToCurrentIncident =
                vehicle.assignment?.currentIncidentId === incident?._id;

              return (
                <Marker
                  key={vehicle._id}
                  position={vehiclePosition}
                  icon={{
                    url: generateVehicleMarkerSVG(
                      vehicle.registration.vehicleType,
                      vehicle.status.currentStatus,
                      vehicle.status.operational,
                      isSelectedVehicle || isAssignedToCurrentIncident
                    ),
                    scaledSize: new google.maps.Size(
                      isSelectedVehicle || isAssignedToCurrentIncident
                        ? 36
                        : 28,
                      isSelectedVehicle || isAssignedToCurrentIncident ? 36 : 28
                    ),
                  }}
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setSelectedInfoWindow(`vehicle-${vehicle._id}`);
                  }}
                  zIndex={isAssignedToCurrentIncident ? 900 : 100}
                />
              );
            })}

            {/* Phase 3: Route Lines for Assigned Vehicles - DISABLED per user request */}
            {/* Removed polylines connecting assigned vehicles to incidents */}

            {/* Phase 3: Suggested Resources Visualization - DISABLED per user request */}
            {/* Removed green polylines showing suggested vehicle routes */}

            {/* Vehicle Info Windows */}
            {selectedVehicle &&
              selectedInfoWindow === `vehicle-${selectedVehicle._id}` && (
                <InfoWindow
                  position={{
                    lat: selectedVehicle.status.currentLocation.coordinates[1],
                    lng: selectedVehicle.status.currentLocation.coordinates[0],
                  }}
                  options={{
                    disableAutoPan: true, // Prevent map from auto-panning when InfoWindow opens
                  }}
                  onCloseClick={() => {
                    setSelectedInfoWindow(null);
                    setSelectedVehicle(null);
                  }}
                >
                  <div className="p-3 max-w-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">
                        {getVehicleTypeIcon(
                          selectedVehicle.registration.vehicleType
                        )}
                      </span>
                      <h4 className="font-semibold text-gray-900">
                        Vehicle #{selectedVehicle.registration.plateNumber}
                      </h4>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">
                          {selectedVehicle.registration.vehicleType.replace(
                            "_",
                            " "
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            getVehicleStatusColors(
                              selectedVehicle.status.currentStatus,
                              selectedVehicle.status.operational
                            ).badgeColor
                          }`}
                        >
                          {selectedVehicle.status.currentStatus
                            .replace("_", " ")
                            .toUpperCase()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Crew:</span>
                        <span className="font-medium">
                          {selectedVehicle.assignment?.crew?.length || 0}{" "}
                          members
                        </span>
                      </div>

                      {selectedVehicle.assignment?.currentIncidentId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned to:</span>
                          <span className="font-medium text-blue-600">
                            {selectedVehicle.assignment.currentIncidentId ===
                            incident?._id
                              ? "This Incident"
                              : selectedVehicle.assignment.currentIncidentId}
                          </span>
                        </div>
                      )}

                      {selectedVehicle.assignment?.assignedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned:</span>
                          <span className="font-medium text-green-600">
                            {new Date(
                              selectedVehicle.assignment.assignedAt
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-gray-600 text-xs">
                          Last updated:{" "}
                          {new Date(
                            selectedVehicle.status.lastLocationUpdate
                          ).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              )}
          </GoogleMap>

          {/* Map Overlay - No Location */}
          {incident && !incident.location.coordinates && (
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
