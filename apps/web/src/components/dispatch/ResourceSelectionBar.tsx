import React, { useState, useEffect } from "react";
import { Vehicle } from "../../utils/vehicleUtils";
import { ResourceSuggestion } from "../../utils/resourceMatrix";
import { useWebSocket } from "../../contexts/WebSocketContext"; // October 20, 2025
import {
  MapPin,
  Clock,
  Users,
  Ambulance,
  Flame,
  Shield,
  Truck,
  CheckCircle,
  X,
  XCircle,
} from "lucide-react";

interface Assignment {
  _id: string;
  resource: {
    vehicleId: {
      _id: string;
      registration: {
        plateNumber: string;
        vehicleType: string;
      };
    };
    primaryCrewId?: {
      _id: string;
      personal: {
        firstName: string;
        lastName: string;
      };
    };
  };
  status: string;
  response?: {
    status?: string; // Current status (more up-to-date than assignment.status)
    acceptedAt?: string;
    enRouteAt?: string;
    onSceneAt?: string;
    completedAt?: string;
    returningAt?: string;
    returnedAt?: string;
    cancelledAt?: string;
    cancellationReason?: string;
  };
  createdAt: string;
}

interface ResourceSelectionBarProps {
  isOpen: boolean;
  incidentLocation: {
    lat: number;
    lng: number;
  };
  incidentId: string;
  incidentStatus?: string; // Current incident status (for read-only mode)
  suggestions: ResourceSuggestion[];
  assignments: Assignment[]; // Current assignments for this incident
  onAssign: (selectedVehicles: Vehicle[]) => void;
  onStatusUpdate: (assignmentId: string, newStatus: string) => void; // For updating assignment status
  onCancelAssignment: (assignmentId: string) => void; // For canceling assignments
  assignmentLoading: boolean;
}

interface VehicleWithDetails extends Vehicle {
  distance: number;
  eta: number;
  isRecommended: boolean;
  isRequired: boolean;
  priority: number;
  reasoning?: string;
  requiredCount?: number;
  requiredIndex?: number;
  isReady?: boolean; // October 20, 2025 - Readiness flag
}

const ResourceSelectionBar: React.FC<ResourceSelectionBarProps> = ({
  isOpen,
  incidentLocation,
  incidentId,
  incidentStatus,
  suggestions,
  assignments,
  onAssign,
  onStatusUpdate,
  onCancelAssignment,
  assignmentLoading,
}) => {
  const { subscribe } = useWebSocket(); // October 20, 2025
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type:
      | "missing-required"
      | "exceeds-required"
      | "exceeds-recommended"
      | "final-confirm";
    message: string;
    counts?: any;
  }>({
    isOpen: false,
    type: "final-confirm",
    message: "",
  });

  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    assignmentId: string | null;
    vehiclePlateNumber: string | null;
  }>({
    isOpen: false,
    assignmentId: null,
    vehiclePlateNumber: null,
  });

  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const getVehicleIcon = (vehicleType: string) => {
    const type = vehicleType.toLowerCase();
    if (type.includes("ambulance")) return Ambulance;
    if (type.includes("fire")) return Flame;
    if (type.includes("rescue")) return Shield;
    return Truck;
  };

  useEffect(() => {
    setSelectedVehicles(new Set());
    setShowWarning(null);
  }, [incidentId]);

  // Subscribe to vehicle readiness updates (October 20, 2025)
  useEffect(() => {
    const handleReadinessUpdate = (data: any) => {
      console.log("📡 Vehicle readiness update received:", data);
      // Update the vehicle in the list
      // Backend sends: { vehicleId, plateNumber, isReady, notReadyReason, timestamp }
      setVehicles((prevVehicles) =>
        prevVehicles.map((v) =>
          v._id === data.vehicleId
            ? {
                ...v,
                readiness: {
                  isReady: data.isReady,
                  lastReadyUpdate: data.timestamp,
                  notReadyReason: data.notReadyReason || null,
                },
                isReady: data.isReady,
              }
            : v
        )
      );
    };

    // subscribe returns an unsubscribe function
    const unsubscribe = subscribe(
      "vehicle_readiness_update",
      handleReadinessUpdate
    );

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  useEffect(() => {
    if (!isOpen) return;

    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const calculateETA = (distance: number): number => {
      return Math.round((distance / 40) * 60);
    };

    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        // Request vehicles with populated crew data to show leader names
        const response = await fetch(
          "http://localhost:5000/api/vehicles?populate=crew",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Get vehicle IDs that have active or pending assignments
          const assignedVehicleIds = new Set(
            assignments
              .filter(
                (a) =>
                  a.status !== "declined" &&
                  a.status !== "completed" &&
                  a.status !== "cancelled"
              )
              .map((a) => a.resource.vehicleId._id)
          );

          // Filter to available/returning vehicles that don't have pending/active assignments
          // Show all vehicles (ready + not ready) - October 20, 2025
          const availableVehicles = result.data.filter(
            (v: Vehicle) =>
              (v.status.currentStatus === "available" ||
                v.status.currentStatus === "returning") &&
              !assignedVehicleIds.has(v._id)
          );

          const enrichedVehicles: VehicleWithDetails[] = availableVehicles.map(
            (vehicle: Vehicle) => {
              let distance = 999;
              let eta = 999;

              if (
                vehicle.status?.currentLocation?.coordinates &&
                vehicle.status.currentLocation.coordinates.length === 2
              ) {
                const [vLng, vLat] = vehicle.status.currentLocation.coordinates;
                distance = calculateDistance(
                  incidentLocation.lat,
                  incidentLocation.lng,
                  vLat,
                  vLng
                );
                eta = calculateETA(distance);
              }

              const vehicleType = vehicle.registration.vehicleType;
              const suggestion = suggestions.find(
                (s) => s.vehicleType.toLowerCase() === vehicleType.toLowerCase()
              );

              const priority = suggestion?.priority || 999;
              const reasoning = suggestion?.reasoning;

              // Check if vehicle is ready (October 20, 2025)
              const isReady = vehicle.readiness?.isReady === true;

              return {
                ...vehicle,
                distance,
                eta,
                isRecommended: false,
                isRequired: false,
                priority,
                reasoning,
                isReady, // Add readiness flag
              };
            }
          );

          const vehiclesByType = new Map<string, VehicleWithDetails[]>();
          enrichedVehicles.forEach((v) => {
            const type = v.registration.vehicleType;
            if (!vehiclesByType.has(type)) {
              vehiclesByType.set(type, []);
            }
            vehiclesByType.get(type)!.push(v);
          });

          vehiclesByType.forEach((vehicles) => {
            vehicles.sort((a, b) => a.distance - b.distance);
          });

          suggestions.forEach((suggestion) => {
            const typeVehicles =
              vehiclesByType.get(suggestion.vehicleType) || [];

            if (suggestion.required) {
              // Check if this vehicle type is already assigned to the incident
              const alreadyAssignedOfType = assignments.some(
                (a) =>
                  a.resource.vehicleId.registration.vehicleType ===
                    suggestion.vehicleType &&
                  !["cancelled", "declined"].includes(
                    a.response?.status || a.status
                  )
              );

              // Only mark as required if no active assignment of this type exists
              if (!alreadyAssignedOfType) {
                const requiredCount = 1;
                typeVehicles
                  .slice(0, requiredCount)
                  .forEach((vehicle, index) => {
                    vehicle.isRequired = true;
                    vehicle.requiredCount = requiredCount;
                    vehicle.requiredIndex = index;
                  });
              }
            } else {
              const recommendedCount = 1;
              typeVehicles.slice(0, recommendedCount).forEach((vehicle) => {
                if (!vehicle.isRequired) {
                  vehicle.isRecommended = true;
                }
              });
            }
          });

          enrichedVehicles.sort((a, b) => {
            if (a.isRequired && !b.isRequired) return -1;
            if (!a.isRequired && b.isRequired) return 1;
            if (a.isRequired && b.isRequired) {
              if (a.priority !== b.priority) return a.priority - b.priority;
              return a.distance - b.distance;
            }
            if (a.isRecommended && !b.isRecommended) return -1;
            if (!a.isRecommended && b.isRecommended) return 1;
            if (a.isRecommended && b.isRecommended) {
              if (a.priority !== b.priority) return a.priority - b.priority;
              return a.distance - b.distance;
            }
            return a.distance - b.distance;
          });

          setVehicles(enrichedVehicles);
        } else {
          throw new Error("Failed to fetch vehicles");
        }
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError("Failed to load vehicles. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [isOpen, incidentLocation, suggestions, assignments]);

  const toggleVehicle = (vehicleId: string) => {
    // Prevent selection if incident is resolved (read-only mode)
    if (incidentStatus === "resolved") {
      return;
    }

    const newSelection = new Set(selectedVehicles);
    if (newSelection.has(vehicleId)) {
      newSelection.delete(vehicleId);
    } else {
      newSelection.add(vehicleId);
    }
    setSelectedVehicles(newSelection);
    setShowWarning(null);
  };

  const handleCancelClick = (
    assignmentId: string,
    vehiclePlateNumber: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent any parent click handlers
    setCancelModal({
      isOpen: true,
      assignmentId,
      vehiclePlateNumber,
    });
    setCancelReason("");
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal.assignmentId) return;

    setCancelling(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/assignments/${cancelModal.assignmentId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: cancelReason || "Cancelled by dispatcher",
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to cancel assignment");
      }

      console.log("✅ Assignment cancelled successfully:", result);

      // Close modal
      setCancelModal({
        isOpen: false,
        assignmentId: null,
        vehiclePlateNumber: null,
      });
      setCancelReason("");

      // Note: Success toast is shown by DispatchWorkspace via WebSocket event
      // The real-time update will handle UI refresh via assignment:cancelled event
    } catch (error: any) {
      console.error("❌ Error cancelling assignment:", error);
      alert(error.message || "Failed to cancel assignment");
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelModalClose = () => {
    setCancelModal({
      isOpen: false,
      assignmentId: null,
      vehiclePlateNumber: null,
    });
    setCancelReason("");
  };

  const getSelectionCounts = () => {
    const requiredVehicles = vehicles.filter((v) => v.isRequired);
    const selectedRequired = vehicles.filter(
      (v) => v.isRequired && selectedVehicles.has(v._id)
    );
    const recommendedCount = vehicles.filter((v) => v.isRecommended).length;

    return {
      totalRequired: requiredVehicles.length,
      selectedRequired: selectedRequired.length,
      totalRecommended: recommendedCount,
      totalSelected: selectedVehicles.size,
    };
  };

  const validateAndProceed = () => {
    const counts = getSelectionCounts();

    if (counts.totalSelected === 0) {
      setShowWarning("Please select at least one vehicle to proceed.");
      return;
    }

    // Check if missing required resources
    if (counts.selectedRequired < counts.totalRequired) {
      const missingCount = counts.totalRequired - counts.selectedRequired;
      setConfirmationModal({
        isOpen: true,
        type: "missing-required",
        message: `${missingCount} required resource(s) not selected`,
        counts,
      });
      return;
    }

    // Check if exceeds required count (new warning)
    if (counts.totalSelected > counts.totalRequired + counts.totalRecommended) {
      const extraCount =
        counts.totalSelected - (counts.totalRequired + counts.totalRecommended);
      setConfirmationModal({
        isOpen: true,
        type: "exceeds-required",
        message: `${extraCount} additional resource(s) selected beyond required and recommended`,
        counts,
      });
      return;
    }

    // Check if exceeds recommended count
    if (
      counts.totalSelected > counts.totalRecommended &&
      counts.totalRecommended > 0 &&
      counts.totalSelected <= counts.totalRequired + counts.totalRecommended
    ) {
      const extraCount = counts.totalSelected - counts.totalRecommended;
      setConfirmationModal({
        isOpen: true,
        type: "exceeds-recommended",
        message: `${extraCount} additional resource(s) selected beyond recommendations`,
        counts,
      });
      return;
    }

    // Final confirmation
    setConfirmationModal({
      isOpen: true,
      type: "final-confirm",
      message: "Confirm resource assignment",
      counts,
    });
  };

  const handleConfirmAssignment = () => {
    const selected = vehicles.filter((v) => selectedVehicles.has(v._id));
    onAssign(selected);
    setSelectedVehicles(new Set());
    setConfirmationModal({ isOpen: false, type: "final-confirm", message: "" });
  };

  const handleCancelConfirmation = () => {
    setConfirmationModal({ isOpen: false, type: "final-confirm", message: "" });
  };

  // Only show if explicitly opened
  if (!isOpen) return null;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm flex flex-col">
      {/* Fixed Header with Actions */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-base font-semibold text-gray-900 whitespace-nowrap">
              {(() => {
                // Count only active assignments (exclude declined, completed, cancelled)
                const activeAssignmentsCount = assignments.filter(
                  (a) =>
                    a.status !== "declined" &&
                    a.status !== "completed" &&
                    a.status !== "cancelled"
                ).length;

                return activeAssignmentsCount > 0
                  ? `Resources (${activeAssignmentsCount} assigned${
                      vehicles.length > 0
                        ? `, ${vehicles.length} available`
                        : ""
                    })`
                  : "Available Resources";
              })()}
            </h3>
            {selectedVehicles.size > 0 && incidentStatus !== "resolved" && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded whitespace-nowrap">
                {selectedVehicles.size} Selected
              </span>
            )}
            {incidentStatus === "resolved" && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded whitespace-nowrap">
                📋 View Only - Incident Resolved
              </span>
            )}
          </div>
          {/* Button container fixed with flex ml-auto */}
          {incidentStatus !== "resolved" && (
            <div className="flex items-center space-x-2 ml-auto">
              {selectedVehicles.size > 0 && (
                <button
                  onClick={() => setSelectedVehicles(new Set())}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium whitespace-nowrap bg-white"
                >
                  Clear Selection
                </button>
              )}
              <button
                onClick={validateAndProceed}
                disabled={assignmentLoading || selectedVehicles.size === 0}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold text-white transition-all whitespace-nowrap ${
                  assignmentLoading || selectedVehicles.size === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {assignmentLoading ? "Assigning..." : "Proceed with Assignment"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="py-3 flex-shrink-0">
        {showWarning && (
          <div className="mb-2 mx-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ {showWarning}
          </div>
        )}
        {error && (
          <div className="mb-2 mx-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            ❌ {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6 mx-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">
              Loading vehicles...
            </span>
          </div>
        )}

        {!loading && vehicles.length > 0 && (
          <div
            className="overflow-x-auto overflow-y-hidden pl-4"
            style={{
              WebkitOverflowScrolling: "touch",
              maxWidth: "70vw",
            }}
          >
            <div
              className="flex space-x-3 pb-2"
              style={{ minWidth: "min-content" }}
            >
              {/* Assigned Vehicles Section */}
              {assignments.map((assignment) => {
                const vehicle = assignment.resource.vehicleId;
                const crewLeader = assignment.resource.primaryCrewId;

                // Use response.status as primary source (more up-to-date), fallback to assignment.status
                const currentStatus =
                  assignment.response?.status || assignment.status;

                const getStatusColor = (status: string) => {
                  switch (status) {
                    case "assigned":
                      return "bg-yellow-100 border-yellow-400";
                    case "accepted":
                      return "bg-blue-100 border-blue-400";
                    case "en_route":
                      return "bg-purple-100 border-purple-400";
                    case "on_scene":
                      return "bg-orange-100 border-orange-400";
                    case "completed":
                      return "bg-green-100 border-green-400";
                    case "declined":
                      return "bg-red-100 border-red-400";
                    case "cancelled":
                      return "bg-red-100 border-red-400";
                    default:
                      return "bg-gray-100 border-gray-400";
                  }
                };

                const getStatusLabel = (status: string) => {
                  switch (status) {
                    case "assigned":
                      return "Pending"; // Assignment created, waiting for crew acceptance
                    case "accepted":
                      return "Accepted";
                    case "en_route":
                      return "En Route";
                    case "on_scene":
                      return "On Scene";
                    case "completed":
                      return "Completed";
                    case "declined":
                      return "Declined";
                    case "cancelled":
                      return "Cancelled";
                    default:
                      return status;
                  }
                };

                const formatTime = (dateString?: string) => {
                  if (!dateString) return "N/A";
                  const date = new Date(dateString);
                  return date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                };

                const isCompleted = currentStatus === "completed";
                const isReturning =
                  isCompleted && !assignment.response?.returnedAt;

                return (
                  <div
                    key={assignment._id}
                    className={`flex-shrink-0 w-64 p-2 rounded-md border-2 ${getStatusColor(
                      currentStatus
                    )} ${isCompleted ? "opacity-70 border-dashed" : ""}`}
                  >
                    {/* Header with icon and vehicle info */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        {React.createElement(
                          getVehicleIcon(vehicle.registration.vehicleType),
                          {
                            className: "w-5 h-5 text-gray-600 flex-shrink-0",
                          }
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-900">
                            {vehicle.registration.plateNumber}
                          </span>
                          <span className="text-xs text-gray-600">
                            {vehicle.registration.vehicleType}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="px-1.5 py-0.5 bg-gray-700 text-white text-[10px] font-bold rounded uppercase">
                          {getStatusLabel(currentStatus)}
                        </span>
                        {isReturning && (
                          <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded uppercase">
                            Returning
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details section */}
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-gray-600">Assigned:</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {formatTime(assignment.createdAt)}
                        </span>
                      </div>
                      {assignment.response?.acceptedAt && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-gray-600">Accepted:</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatTime(assignment.response.acceptedAt)}
                          </span>
                        </div>
                      )}
                      {assignment.response?.enRouteAt && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-gray-600">En Route:</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatTime(assignment.response.enRouteAt)}
                          </span>
                        </div>
                      )}
                      {assignment.response?.onSceneAt && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-gray-600">On Scene:</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatTime(assignment.response.onSceneAt)}
                          </span>
                        </div>
                      )}
                      {assignment.response?.completedAt && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-gray-600">Completed:</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatTime(assignment.response.completedAt)}
                          </span>
                        </div>
                      )}
                      {assignment.response?.returningAt && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-gray-600">Returning:</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatTime(assignment.response.returningAt)}
                          </span>
                        </div>
                      )}
                      {assignment.response?.returnedAt && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-gray-600">Returned:</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatTime(assignment.response.returnedAt)}
                          </span>
                        </div>
                      )}
                      {assignment.response?.cancelledAt && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-gray-600">Cancelled:</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatTime(assignment.response.cancelledAt)}
                          </span>
                        </div>
                      )}
                      {assignment.response?.cancellationReason && (
                        <div className="text-xs text-red-600 italic mt-1">
                          Reason: {assignment.response.cancellationReason}
                        </div>
                      )}
                      {crewLeader && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-gray-600">Leader:</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {crewLeader.personal.firstName}{" "}
                            {crewLeader.personal.lastName.charAt(0)}.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cancel Button - Only show for cancellable statuses */}
                    {["assigned", "accepted", "en_route"].includes(
                      currentStatus
                    ) && (
                      <button
                        onClick={(e) =>
                          handleCancelClick(
                            assignment._id,
                            vehicle.registration.plateNumber,
                            e
                          )
                        }
                        className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded transition-colors"
                        disabled={assignmentLoading}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel Assignment
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Available Vehicles Section */}
              {vehicles.map((vehicle) => {
                const isSelected = selectedVehicles.has(vehicle._id);
                const crewCount = vehicle.assignment?.crew?.length || 0;
                const isReady = vehicle.isReady !== false; // Default true if undefined for backward compatibility
                const isReturning =
                  vehicle.status.currentStatus === "returning";

                return (
                  <div
                    key={vehicle._id}
                    onClick={() => {
                      // Only allow selection if vehicle is ready
                      if (isReady) {
                        toggleVehicle(vehicle._id);
                      }
                    }}
                    className={`flex-shrink-0 w-64 p-2 rounded-md border-2 transition-all ${
                      !isReady
                        ? "opacity-50 border-gray-300 bg-gray-100 cursor-not-allowed"
                        : isSelected
                        ? "border-blue-600 bg-blue-50 cursor-pointer"
                        : vehicle.isRequired
                        ? "border-red-400 bg-red-50 hover:border-red-500 cursor-pointer"
                        : vehicle.isRecommended
                        ? "border-green-400 bg-green-50 hover:border-green-500 cursor-pointer"
                        : "border-gray-300 bg-white hover:border-gray-400 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isReady}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                        />
                        {React.createElement(
                          getVehicleIcon(vehicle.registration.vehicleType),
                          {
                            className: "w-5 h-5 text-gray-600 flex-shrink-0",
                          }
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-900">
                            {vehicle.registration.plateNumber}
                          </span>
                          <span className="text-xs text-gray-600">
                            {vehicle.registration.vehicleType}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {!isReady && (
                          <span className="px-1.5 py-0.5 bg-gray-500 text-white text-[10px] font-bold rounded uppercase">
                            Not Ready
                          </span>
                        )}
                        {isReady && isReturning && (
                          <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded uppercase">
                            Returning
                          </span>
                        )}
                        {isReady && vehicle.isRequired && (
                          <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded uppercase">
                            Required
                          </span>
                        )}
                        {isReady &&
                          vehicle.isRecommended &&
                          !vehicle.isRequired && (
                            <span className="px-1.5 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded uppercase">
                              Suggested
                            </span>
                          )}
                      </div>
                    </div>

                    {vehicle.reasoning &&
                      (vehicle.isRequired || vehicle.isRecommended) && (
                        <div className="mb-1.5 p-1.5 bg-gray-100 rounded text-xs text-gray-700 leading-tight">
                          {vehicle.reasoning}
                        </div>
                      )}

                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-gray-600">Distance:</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {vehicle.distance < 999
                            ? `${vehicle.distance.toFixed(1)} km`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-gray-600">ETA:</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {vehicle.eta < 999 ? `~${vehicle.eta} min` : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-gray-600">Crew:</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {(() => {
                            // Find crew leader
                            const crewLeader = vehicle.assignment?.crew?.find(
                              (member: any) =>
                                member.professional?.isLeader === true
                            );

                            // Debug logging
                            if (crewCount > 0 && !crewLeader) {
                              console.log(
                                `⚠️ Vehicle ${vehicle.registration.plateNumber} has ${crewCount} crew but no leader found:`,
                                vehicle.assignment?.crew
                              );
                            }

                            // Display crew count with leader name
                            if (crewLeader && crewCount > 0) {
                              return (
                                <>
                                  {crewCount} ({crewLeader.personal.firstName}{" "}
                                  {crewLeader.personal.lastName.charAt(0)}.)
                                </>
                              );
                            } else {
                              return `${crewCount} member${
                                crewCount !== 1 ? "s" : ""
                              }`;
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && vehicles.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm font-medium">No available vehicles</p>
            <p className="text-xs">
              All vehicles are currently assigned or unavailable
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div
              className={`px-6 py-4 ${
                confirmationModal.type === "missing-required"
                  ? "bg-red-50 border-b border-red-200"
                  : confirmationModal.type === "exceeds-required"
                  ? "bg-yellow-50 border-b border-yellow-200"
                  : confirmationModal.type === "exceeds-recommended"
                  ? "bg-blue-50 border-b border-blue-200"
                  : "bg-gray-50 border-b border-gray-200"
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {confirmationModal.type === "missing-required" && (
                  <>
                    <span className="text-2xl">⚠️</span>
                    Missing Required Resources
                  </>
                )}
                {confirmationModal.type === "exceeds-required" && (
                  <>
                    <span className="text-2xl">⚠️</span>
                    Excess Resources Selected
                  </>
                )}
                {confirmationModal.type === "exceeds-recommended" && (
                  <>
                    <span className="text-2xl">ℹ️</span>
                    Additional Resources Selected
                  </>
                )}
                {confirmationModal.type === "final-confirm" && (
                  <>
                    <span className="text-2xl">✅</span>
                    Confirm Assignment
                  </>
                )}
              </h3>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              {confirmationModal.type === "missing-required" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    {confirmationModal.message}. Proceeding without all required
                    resources may affect response effectiveness.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Required:</span>
                      <span className="font-semibold text-gray-900">
                        {confirmationModal.counts?.totalRequired}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Selected:</span>
                      <span className="font-semibold text-red-600">
                        {confirmationModal.counts?.selectedRequired}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Selected:</span>
                      <span className="font-semibold text-gray-900">
                        {confirmationModal.counts?.totalSelected}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {confirmationModal.type === "exceeds-required" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    You have selected {confirmationModal.message}. This may tie
                    up resources needed for other incidents.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Required:</span>
                      <span className="font-semibold text-gray-900">
                        {confirmationModal.counts?.totalRequired}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Recommended:</span>
                      <span className="font-semibold text-gray-900">
                        {confirmationModal.counts?.totalRecommended}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Selected:</span>
                      <span className="font-semibold text-yellow-600">
                        {confirmationModal.counts?.totalSelected}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic">
                    Consider reducing selection to recommended levels.
                  </p>
                </div>
              )}

              {confirmationModal.type === "exceeds-recommended" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    {confirmationModal.message}. This may be necessary for
                    complex incidents.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Recommended:</span>
                      <span className="font-semibold text-gray-900">
                        {confirmationModal.counts?.totalRecommended}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Selected:</span>
                      <span className="font-semibold text-blue-600">
                        {confirmationModal.counts?.totalSelected}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {confirmationModal.type === "final-confirm" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    You are about to assign{" "}
                    <strong>{confirmationModal.counts?.totalSelected}</strong>{" "}
                    vehicle(s) to incident <strong>{incidentId}</strong>.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Required Resources:</span>
                      <span className="font-semibold text-gray-900">
                        {confirmationModal.counts?.selectedRequired}/
                        {confirmationModal.counts?.totalRequired}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Vehicles:</span>
                      <span className="font-semibold text-gray-900">
                        {confirmationModal.counts?.totalSelected}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={handleCancelConfirmation}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors ${
                  confirmationModal.type === "missing-required"
                    ? "bg-red-600 hover:bg-red-700"
                    : confirmationModal.type === "exceeds-required"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmationModal.type === "final-confirm"
                  ? "Confirm Assignment"
                  : "Proceed Anyway"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Assignment Confirmation Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Cancel Assignment
                </h3>
                <button
                  onClick={handleCancelModalClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  Are you sure you want to cancel the assignment for vehicle{" "}
                  <span className="font-bold text-gray-900">
                    {cancelModal.vehiclePlateNumber}
                  </span>
                  ?
                </p>
                <p className="text-sm text-red-600">
                  ⚠️ The vehicle will return to available status and the crew
                  will be notified.
                </p>
              </div>

              <div>
                <label
                  htmlFor="cancelReason"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Cancellation Reason (Optional)
                </label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., Assignment sent to wrong vehicle, incident cancelled, closer unit available..."
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {cancelReason.length}/200 characters
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={handleCancelModalClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={cancelling}
              >
                Keep Assignment
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelling}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? "Cancelling..." : "Cancel Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceSelectionBar;
