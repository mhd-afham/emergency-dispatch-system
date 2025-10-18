import React, { useState } from "react";
import {
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Truck,
} from "lucide-react";

interface Assignment {
  _id: string;
  incidentId: string;
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
  status:
    | "pending"
    | "assigned"
    | "accepted"
    | "declined"
    | "en_route"
    | "on_scene"
    | "completed";
  response?: {
    acceptedAt?: string;
    enRouteAt?: string;
    onSceneAt?: string;
    completedAt?: string;
    declineReason?: string;
  };
  createdAt: string; // Mongoose timestamps
  updatedAt: string; // Mongoose timestamps
}

interface AssignmentTrackerProps {
  assignments: Assignment[];
  onStatusUpdate: (assignmentId: string, newStatus: string) => void;
  onCancelAssignment: (assignmentId: string) => void;
}

const AssignmentTracker: React.FC<AssignmentTrackerProps> = ({
  assignments,
  onStatusUpdate,
  onCancelAssignment,
}) => {
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(
    null
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        icon: Clock,
        label: "Pending",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-300",
      },
      assigned: {
        icon: AlertCircle,
        label: "Assigned",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        borderColor: "border-blue-300",
      },
      accepted: {
        icon: CheckCircle,
        label: "Accepted",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-300",
      },
      declined: {
        icon: XCircle,
        label: "Declined",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-300",
      },
      en_route: {
        icon: Truck,
        label: "En Route",
        bgColor: "bg-indigo-100",
        textColor: "text-indigo-800",
        borderColor: "border-indigo-300",
      },
      on_scene: {
        icon: AlertCircle,
        label: "On Scene",
        bgColor: "bg-purple-100",
        textColor: "text-purple-800",
        borderColor: "border-purple-300",
      },
      completed: {
        icon: CheckCircle,
        label: "Completed",
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        borderColor: "border-gray-300",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAvailableStatusTransitions = (currentStatus: string) => {
    const transitions: { [key: string]: string[] } = {
      pending: ["assigned", "declined"],
      assigned: ["accepted", "declined"],
      accepted: ["en_route", "declined"],
      declined: [], // Terminal state
      en_route: ["on_scene"],
      on_scene: ["completed"],
      completed: [], // Terminal state
    };

    return transitions[currentStatus] || [];
  };

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="text-center py-6">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No assignments yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Assign resources to this incident to track their status
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">
          Active Assignments ({assignments.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {assignments.map((assignment) => {
          const isExpanded = expandedAssignment === assignment._id;
          const availableTransitions = getAvailableStatusTransitions(
            assignment.status
          );
          const vehicle = assignment.resource.vehicleId;
          const crewLeader = assignment.resource.primaryCrewId;

          return (
            <div
              key={assignment._id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      {vehicle.registration.plateNumber}
                    </div>
                    <div className="text-xs text-gray-500">
                      {vehicle.registration.vehicleType}
                    </div>
                  </div>
                </div>
                {getStatusBadge(assignment.status)}
              </div>

              {/* Crew Leader */}
              {crewLeader && (
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>
                    Leader: {crewLeader.personal.firstName}{" "}
                    {crewLeader.personal.lastName}
                  </span>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Created: {formatTime(assignment.createdAt)}</span>
                {assignment.response?.acceptedAt && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span>
                      Accepted: {formatTime(assignment.response.acceptedAt)}
                    </span>
                  </>
                )}
                {assignment.response?.onSceneAt && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span>
                      Arrived: {formatTime(assignment.response.onSceneAt)}
                    </span>
                  </>
                )}
              </div>

              {/* Decline Reason */}
              {assignment.status === "declined" &&
                assignment.response?.declineReason && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <strong>Decline Reason:</strong>{" "}
                    {assignment.response.declineReason}
                  </div>
                )}

              {/* Action Buttons */}
              {availableTransitions.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setExpandedAssignment(isExpanded ? null : assignment._id)
                    }
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    {isExpanded ? "Hide Actions" : "Update Status"}
                  </button>

                  {assignment.status !== "completed" &&
                    assignment.status !== "declined" && (
                      <>
                        <span className="text-gray-300">•</span>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to cancel this assignment?"
                              )
                            ) {
                              onCancelAssignment(assignment._id);
                            }
                          }}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Cancel Assignment
                        </button>
                      </>
                    )}
                </div>
              )}

              {/* Status Update Dropdown (Expanded) */}
              {isExpanded && availableTransitions.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Update Status:
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {availableTransitions.map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          onStatusUpdate(assignment._id, status);
                          setExpandedAssignment(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        {status.replace("_", " ").toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentTracker;
