import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useWebSocket } from "../../contexts/WebSocketContext";

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

interface IncidentQueueProps {
  onIncidentSelect?: (incident: Incident) => void;
  selectedIncidentId?: string;
}

const IncidentQueue: React.FC<IncidentQueueProps> = ({
  onIncidentSelect,
  selectedIncidentId,
}) => {
  const { subscribe, isConnected, isConnecting } = useWebSocket();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"priority" | "time">("priority");
  const [filterStatus, setFilterStatus] = useState<string>("active"); // 'active', 'all', 'pending', etc.

  // Priority order for sorting (critical first)
  const priorityOrder = useMemo(
    () => ({ critical: 4, high: 3, medium: 2, low: 1 }),
    []
  );

  // Severity styling
  const severityStyles = {
    critical: "bg-red-50 border-red-200 ring-red-500/30",
    high: "bg-orange-50 border-orange-200 ring-orange-500/30",
    medium: "bg-yellow-50 border-yellow-200 ring-yellow-500/30",
    low: "bg-green-50 border-green-200 ring-green-500/30",
  };

  const severityBadges = {
    critical: "bg-red-600 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-yellow-500 text-white",
    low: "bg-green-500 text-white",
  };

  const statusStyles = {
    pending: "text-amber-600 bg-amber-50",
    assigned: "text-blue-600 bg-blue-50",
    en_route: "text-indigo-600 bg-indigo-50",
    on_scene: "text-purple-600 bg-purple-50",
    resolved: "text-green-600 bg-green-50",
    cancelled: "text-gray-600 bg-gray-50",
  };

  // Fetch incidents from backend
  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const apiUrl =
        process.env.REACT_APP_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/incidents`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized access. Please log in again.");
        }
        throw new Error(`Failed to fetch incidents: ${response.statusText}`);
      }

      const data = await response.json();
      setIncidents(data.data?.incidents || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket event handlers for real-time updates
  useEffect(() => {
    const unsubscribeCreate = subscribe(
      "incident_created",
      (newIncident: Incident) => {
        console.log("📱 [IncidentQueue] New incident created:", newIncident.incidentId);
        setIncidents((prev) => [newIncident, ...prev]);
      }
    );

    const unsubscribeUpdate = subscribe(
      "incident_update",
      (updatedIncident: Incident) => {
        console.log("📱 [IncidentQueue] Incident updated:", updatedIncident.incidentId);
        setIncidents((prev) =>
          prev.map((incident) =>
            incident._id === updatedIncident._id ? updatedIncident : incident
          )
        );
      }
    );

    const unsubscribeDelete = subscribe(
      "incident_deleted",
      (incidentId: string) => {
        console.log("📱 [IncidentQueue] Incident deleted:", incidentId);
        setIncidents((prev) =>
          prev.filter((incident) => incident._id !== incidentId)
        );
      }
    );

    return () => {
      unsubscribeCreate();
      unsubscribeUpdate();
      unsubscribeDelete();
    };
  }, [subscribe]);

  // Initial load
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Filter and sort incidents
  const filteredAndSortedIncidents = useMemo(() => {
    let filtered = incidents;

    // Apply status filter
    if (filterStatus === "active") {
      filtered = incidents.filter((incident) =>
        ["pending", "assigned", "en_route", "on_scene"].includes(
          incident.status
        )
      );
    } else if (filterStatus !== "all") {
      filtered = incidents.filter(
        (incident) => incident.status === filterStatus
      );
    }

    // Sort incidents
    return filtered.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityDiff =
          priorityOrder[b.severity] - priorityOrder[a.severity];
        // If same priority, sort by creation time (newest first)
        return priorityDiff !== 0
          ? priorityDiff
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        // Sort by time (newest first)
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    });
  }, [incidents, sortBy, filterStatus, priorityOrder]);

  // Handle incident selection
  const handleIncidentClick = (incident: Incident) => {
    if (onIncidentSelect) {
      onIncidentSelect(incident);
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format incident type for display
  const formatIncidentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading incidents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-red-600 mb-4 text-center">{error}</div>
        <button
          onClick={fetchIncidents}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Incident Queue ({filteredAndSortedIncidents.length})
            </h2>
            {/* WebSocket connection status */}
            <div
              className={`flex items-center gap-1 text-xs ${
                isConnected ? "text-green-600" : "text-amber-600"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? "bg-green-500 animate-pulse"
                    : isConnecting
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
              ></div>
              {isConnected
                ? "Live Updates"
                : isConnecting
                ? "Connecting..."
                : "Disconnected"}
            </div>
          </div>
          <button
            onClick={fetchIncidents}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Refresh"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Filters and Sort Controls */}
        <div className="flex gap-2 text-sm">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "priority" | "time")}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="priority">Sort by Priority</option>
            <option value="time">Sort by Time</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active Only</option>
            <option value="all">All Incidents</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="en_route">En Route</option>
            <option value="on_scene">On Scene</option>
          </select>
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedIncidents.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No incidents found
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredAndSortedIncidents.map((incident) => (
              <div
                key={incident._id}
                onClick={() => handleIncidentClick(incident)}
                className={`
                  p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                  ${severityStyles[incident.severity]}
                  ${
                    selectedIncidentId === incident._id
                      ? "ring-2 ring-blue-500 shadow-md"
                      : ""
                  }
                `}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        severityBadges[incident.severity]
                      }`}
                    >
                      {incident.severity.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      #{incident.incidentId}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(incident.createdAt)}
                  </div>
                </div>

                {/* Incident Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {formatIncidentType(incident.incidentType)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        statusStyles[incident.status]
                      }`}
                    >
                      {incident.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700 line-clamp-2">
                    {incident.description}
                  </div>

                  <div className="text-sm text-gray-600">
                    📍 {incident.location.address}, {incident.location.city}
                  </div>

                  <div className="text-sm text-gray-600">
                    👤 {incident.callerInfo.name} •{" "}
                    {incident.callerInfo.contactNumber}
                  </div>

                  {/* Assigned Resources */}
                  {incident.assignedResources.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      🚨 {incident.assignedResources.length} resource
                      {incident.assignedResources.length > 1 ? "s" : ""}{" "}
                      assigned
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentQueue;