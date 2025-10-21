import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { websocketService } from "../services/websocketService";
import { apiClient } from "../services/apiClient";
import { locationService } from "../services/locationService";
import { ASSIGNMENT_STATUS, VEHICLE_STATUS } from "../constants";
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from "../styles/theme";
import AssignmentNotificationModal from "./AssignmentNotificationModal";

interface DashboardScreenProps {
  user: any;
  crew: any;
  onLogout: () => void;
}

interface Assignment {
  _id: string;
  incident: {
    incidentId: {
      _id: string;
      incidentId: string;
      incidentType?: string;
      incidentCategory?: string;
      severity?: string;
      location?: {
        address: string;
        city: string;
        province: string;
        coordinates?: {
          type: string;
          coordinates: [number, number];
        };
      };
      description?: string;
      status?: string;
    };
  };
  response?: {
    status: string;
    acceptedAt?: string;
    enRouteAt?: string;
    onSceneAt?: string;
    completedAt?: string;
    returningAt?: string;
    returnedAt?: string;
  };
  status: string;
  dispatch?: {
    assignedAt: string;
  };
}

interface Vehicle {
  _id: string;
  registration: {
    plateNumber: string;
    vehicleType: string;
  };
  status: {
    operational: string;
    currentStatus: string;
  };
  readiness?: {
    isReady: boolean;
    lastReadyUpdate?: string;
    notReadyReason?: string | null;
  };
  equipment?: any;
  assignment?: {
    crew: any[];
  };
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  crew,
  onLogout,
}) => {
  // State management
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(
    null
  );
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [assignmentHistory, setAssignmentHistory] = useState<Assignment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [readinessLoading, setReadinessLoading] = useState(false); // October 20, 2025
  const [hasCompletedAssignment, setHasCompletedAssignment] = useState(false); // October 21, 2025
  const [forceRenderCount, setForceRenderCount] = useState(0); // October 21, 2025 - Force re-render

  // Assignment notification state
  const [showNotification, setShowNotification] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<any>(null);

  // WebSocket connection status check
  useEffect(() => {
    const checkConnection = () => {
      const status = websocketService.getConnectionStatus();
      setIsConnected(status);
    };

    // Check immediately
    checkConnection();

    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  // WebSocket event listeners
  useEffect(() => {
    console.log("🎧 Setting up WebSocket listeners for crew:", crew._id);

    // Listen for new assignment notifications
    websocketService.onAssignmentNotification((data) => {
      console.log("[ASSIGNMENT] New assignment notification received:", data);
      setPendingAssignment(data);
      setShowNotification(true);
    });

    // Listen for assignment status updates
    websocketService.onAssignmentStatusUpdate((data) => {
      console.log("📊 Assignment status update:", data);

      // Update current assignment if it's the one that was updated
      setCurrentAssignment((prevAssignment) => {
        if (prevAssignment && prevAssignment._id === data.assignmentId) {
          console.log(
            `📱 Updating assignment status from ${prevAssignment.status} to ${data.status}`
          );

          // Special handling for "returned" status - clear assignment immediately
          if (data.status === "returned") {
            console.log("📱 Assignment returned - clearing local state");
            setHasCompletedAssignment(false);
            // Refresh vehicle and assignments to show any new assignments
            fetchVehicle();
            fetchCurrentAssignment();
            return null; // Clear assignment from state
          }

          const updatedAssignment = {
            ...prevAssignment,
            status: data.status,
            response: {
              ...prevAssignment.response,
              status: data.status,
            },
          };

          // Track completed assignments
          if (data.status === ASSIGNMENT_STATUS.COMPLETED) {
            setHasCompletedAssignment(true);
            console.log(
              `📱 Assignment completed - setting hasCompletedAssignment flag`
            );
            // Fetch vehicle to get updated "returning" status
            // This is critical for showing the "Returned to Station" button
            fetchVehicle();
          } else if (data.status !== "returned") {
            setHasCompletedAssignment(false);
            fetchCurrentAssignment();
          }

          // Force re-render to ensure UI updates
          setForceRenderCount((prev) => prev + 1);
          console.log(`📱 Forcing UI re-render after assignment status update`);

          return updatedAssignment;
        }
        return prevAssignment;
      });
    });

    // Listen for assignment cancellation
    websocketService.onAssignmentCancelled((data) => {
      console.log("🚫 Assignment cancelled:", data);

      // Check if it's the current assignment that was cancelled
      if (currentAssignment && currentAssignment._id === data.assignmentId) {
        Alert.alert(
          "Assignment Cancelled",
          `Your assignment has been cancelled by dispatch.\n\nReason: ${
            data.reason || "No reason provided"
          }`,
          [
            {
              text: "OK",
              onPress: () => {
                // Clear current assignment and reload dashboard
                setCurrentAssignment(null);
                loadDashboardData();
              },
            },
          ]
        );
      }
    });

    // Listen for vehicle readiness updates (October 21, 2025)
    // This handles automatic readiness updates from backend (e.g., after completing assignment)
    websocketService.onVehicleReadinessUpdate((data) => {
      console.log("🚗 Vehicle readiness update:", data);

      // Update local vehicle state if it's our vehicle
      setVehicle((prevVehicle) => {
        if (prevVehicle && prevVehicle._id === data.vehicleId) {
          const updatedVehicle = {
            ...prevVehicle,
            readiness: {
              ...prevVehicle.readiness,
              isReady: data.isReady,
              notReadyReason: data.notReadyReason || null,
              lastReadyUpdate: data.timestamp,
            },
          };
          console.log(
            `✅ Vehicle readiness updated in UI: ${
              data.isReady ? "READY" : "NOT READY"
            }`
          );
          return updatedVehicle;
        }
        return prevVehicle;
      });
    });

    // Listen for vehicle status updates (October 21, 2025)
    // This handles real-time vehicle status changes (e.g., completing assignment -> returning, returned -> available)
    websocketService.onVehicleStatusUpdate((data) => {
      console.log("🚛 Vehicle status update received:", data);

      // Update local vehicle state if it's our vehicle
      setVehicle((prevVehicle) => {
        if (prevVehicle && prevVehicle._id === data.vehicleId) {
          console.log(
            `🚛 Updating vehicle status from ${prevVehicle.status?.currentStatus} to ${data.status}`
          );

          const updatedVehicle = {
            ...prevVehicle,
            status: {
              ...prevVehicle.status,
              currentStatus: data.status,
            },
          };

          console.log(`✅ Vehicle status updated in UI: ${data.status}`);

          // Handle status transitions
          if (data.status === "returning") {
            // Assignment was completed - vehicle is returning
            // CRITICAL: Set flag to ensure button appears
            console.log("🚗 Vehicle is returning - setting completed flag");
            setHasCompletedAssignment(true);
          } else if (data.status === "available") {
            // Vehicle returned to station - clear any lingering assignment state
            console.log("🏠 Vehicle is available - clearing assignment state");
            setCurrentAssignment(null);
            setHasCompletedAssignment(false);
            fetchCurrentAssignment(); // Check for any new assignments
          } else if (data.status === "assigned") {
            // New assignment received
            fetchCurrentAssignment();
            console.log(
              "🔄 Refreshing current assignment due to status change"
            );
          }

          return updatedVehicle;
        }
        return prevVehicle;
      });

      // Force re-render AFTER state update to ensure button updates
      // Small delay to ensure state is updated first
      setTimeout(() => {
        setForceRenderCount((prev) => {
          const newCount = prev + 1;
          console.log(
            `📱 Forcing UI re-render (count: ${newCount}) after vehicle status update to: ${data.status}`
          );
          return newCount;
        });
      }, 100);
    });

    // Cleanup listeners on unmount
    return () => {
      console.log("🧹 Cleaning up WebSocket listeners");
    };
  }, [crew._id]); // Only depend on crew._id to avoid WebSocket loop (October 21, 2025)

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    // Request location permissions on mount
    requestLocationPermissions();
  }, []);

  // Request location permissions
  const requestLocationPermissions = async () => {
    const granted = await locationService.requestPermissions();
    if (!granted) {
      Alert.alert(
        "Location Permission Required",
        "This app needs location access to track your position during assignments. Please enable 'While Using App' location permissions in iOS Settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              // iOS settings deep link
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              }
            },
          },
        ]
      );
    } else {
      console.log("✅ Location permissions granted successfully");
    }
  };

  // Manage GPS tracking based on vehicle status (October 20, 2025)
  // Automatic GPS management - no manual control
  useEffect(() => {
    const manageLocationTracking = async () => {
      if (!vehicle) {
        // No vehicle - stop tracking if active
        if (locationService.isCurrentlyTracking()) {
          locationService.stopTracking();
          console.log("🛑 Stopped location tracking (no vehicle)");
        }
        return;
      }

      const vehicleStatus = vehicle.status?.currentStatus;

      // GPS ON when: assigned, en_route, on_scene, returning
      // GPS OFF when: available
      const shouldTrack =
        vehicleStatus === VEHICLE_STATUS.ASSIGNED ||
        vehicleStatus === VEHICLE_STATUS.EN_ROUTE ||
        vehicleStatus === VEHICLE_STATUS.ON_SCENE ||
        vehicleStatus === VEHICLE_STATUS.RETURNING;

      if (shouldTrack) {
        if (!locationService.isCurrentlyTracking()) {
          const started = await locationService.startTracking(crew._id);
          if (started) {
            console.log(
              `🎯 Started location tracking (vehicle status: ${vehicleStatus})`
            );
          } else {
            Alert.alert(
              "Location Tracking Failed",
              "Unable to start location tracking. Please check your location permissions.",
              [{ text: "OK" }]
            );
          }
        }
      } else {
        // Stop tracking when vehicle is available
        if (locationService.isCurrentlyTracking()) {
          locationService.stopTracking();
          console.log(
            `🛑 Stopped location tracking (vehicle status: ${vehicleStatus})`
          );
        }
      }
    };

    manageLocationTracking();
  }, [vehicle, crew._id]);

  // Fetch current assignment
  const fetchCurrentAssignment = async () => {
    const caller = new Error().stack?.split("\n")[2]?.trim() || "unknown";
    console.log(`📋 fetchCurrentAssignment called from: ${caller}`);

    try {
      console.log(`📋 Fetching assignments for crew: ${crew._id}`);
      const response = await apiClient.getCrewAssignments(crew._id);
      const assignments = response.data.data;

      console.log(`📋 Raw API response:`, {
        count: assignments.length,
        rawAssignments: assignments.length > 0 ? assignments[0] : null,
      });

      console.log(
        `📋 Received ${assignments.length} assignments:`,
        assignments.map((a: Assignment) => ({
          id: a._id,
          status: a.status || a.response?.status || "UNKNOWN",
          rawStatus: a.status,
          responseStatus: a.response?.status,
          incidentId: a.incident?.incidentId?.incidentId || "N/A",
        }))
      );

      // Find first active assignment (include completed for "Returned to Station" button)
      // Only exclude cancelled and declined assignments
      const activeAssignment = assignments.find((a: Assignment) => {
        // Try different ways to get the status
        const assignmentStatus = a.status || a.response?.status;

        // If still no status, log the raw assignment structure for debugging
        if (!assignmentStatus) {
          console.log(
            `📋 Assignment with undefined status:`,
            JSON.stringify(a, null, 2)
          );
        }

        return (
          assignmentStatus !== ASSIGNMENT_STATUS.CANCELLED &&
          assignmentStatus !== ASSIGNMENT_STATUS.DECLINED
        );
      });

      console.log(
        `📋 Active assignment found:`,
        activeAssignment
          ? {
              id: activeAssignment._id,
              status:
                activeAssignment.status ||
                activeAssignment.response?.status ||
                "UNKNOWN",
              rawStatus: activeAssignment.status,
              responseStatus: activeAssignment.response?.status,
              incidentId:
                activeAssignment.incident?.incidentId?.incidentId || "N/A",
            }
          : "None"
      );

      // If we found an assignment but status is undefined, try to use response.status
      let finalAssignment = activeAssignment;
      if (activeAssignment) {
        // Ensure the assignment has a proper status
        if (!activeAssignment.status && activeAssignment.response?.status) {
          console.log(
            `📋 Fixing assignment status: using response.status (${activeAssignment.response.status})`
          );
          finalAssignment = {
            ...activeAssignment,
            status: activeAssignment.response.status,
          };
        } else if (
          !activeAssignment.status &&
          !activeAssignment.response?.status
        ) {
          console.log(`📋 WARNING: Assignment has no status in either field!`);
          // Don't set the assignment if we can't determine its status
          finalAssignment = null;
        }
      }

      // Special handling: Don't clear completed assignments when backend returns empty
      if (!finalAssignment && hasCompletedAssignment) {
        console.log(
          `📋 No assignments returned but we have a completed assignment - keeping current assignment`
        );
        return; // Don't update currentAssignment, keep the existing one
      }

      setCurrentAssignment(finalAssignment || null);

      // Track if we have a completed assignment
      if (finalAssignment?.status === ASSIGNMENT_STATUS.COMPLETED) {
        setHasCompletedAssignment(true);
      } else if (finalAssignment?.status !== ASSIGNMENT_STATUS.COMPLETED) {
        setHasCompletedAssignment(false);
      }
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      if (error.response?.status !== 404) {
        Alert.alert("Error", "Failed to load assignments");
      }
    }
  };

  // Fetch vehicle info
  const fetchVehicle = async () => {
    try {
      const response = await apiClient.getCrewVehicle(crew._id);
      setVehicle(response.data.data);
    } catch (error: any) {
      console.error("Error fetching vehicle:", error);
      if (error.response?.status !== 404) {
        Alert.alert("Error", "Failed to load vehicle information");
      }
    }
  };

  // Fetch assignment history
  const fetchAssignmentHistory = async () => {
    try {
      const response = await apiClient.getCrewAssignmentHistory(crew._id, 5);
      setAssignmentHistory(response.data.data || []);
      console.log(
        `✅ [DashboardScreen] Loaded ${
          response.data.data?.length || 0
        } history items`
      );
    } catch (error: any) {
      console.error("Error fetching assignment history:", error);
      // Don't show error alert for history - it's not critical
    }
  };

  // Load all dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCurrentAssignment(),
        fetchVehicle(),
        fetchAssignmentHistory(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Handle assignment notification responses
  const handleAcceptAssignment = async () => {
    setShowNotification(false);
    await fetchCurrentAssignment(); // Refresh to show new assignment
  };

  const handleDeclineAssignment = async () => {
    setShowNotification(false);
    // Clear current assignment and refresh to check for any other assignments
    setCurrentAssignment(null);
    await fetchCurrentAssignment();
  };

  const handleNotificationTimeout = () => {
    setShowNotification(false);
    Alert.alert(
      "Assignment Timeout",
      "You did not respond in time. The dispatcher has been notified.",
      [{ text: "OK" }]
    );
  };

  // Update assignment status
  const updateStatus = async (newStatus: string) => {
    if (!currentAssignment) return;

    try {
      console.log(`📱 Updating assignment status to: ${newStatus}`);
      console.log(
        `📱 Current vehicle status before update: ${vehicle?.status?.currentStatus}`
      );

      await apiClient.updateAssignmentStatus(currentAssignment._id, newStatus);

      // Update local state - IMPORTANT: Update both status fields
      const updatedAssignment = {
        ...currentAssignment,
        status: newStatus,
        response: {
          ...currentAssignment.response,
          status: newStatus, // ← FIX: Update response.status too!
        },
      };
      setCurrentAssignment(updatedAssignment);

      console.log(
        `📱 Assignment status updated locally to: ${newStatus} (both status fields)`
      );

      // Set completion flag immediately for "Returned to Station" button
      if (newStatus === ASSIGNMENT_STATUS.COMPLETED) {
        setHasCompletedAssignment(true);
        console.log(
          `📱 ✅ Setting hasCompletedAssignment=true for immediate button display`
        );
      }

      // Fetch updated vehicle data to get the new status from backend
      // This is crucial for status transitions like "completed" -> "returning"
      try {
        const vehicleResponse = await apiClient.getCrewVehicle(crew._id);
        const updatedVehicle = vehicleResponse.data.data;
        setVehicle(updatedVehicle);

        console.log(
          `📱 Vehicle data fetched after status update. New vehicle status: ${updatedVehicle?.status?.currentStatus}`
        );

        // Special handling for completed status to ensure UI updates properly
        if (newStatus === ASSIGNMENT_STATUS.COMPLETED) {
          console.log(
            `📱 Assignment completed. Vehicle should be returning. Vehicle status: ${updatedVehicle?.status?.currentStatus}`
          );
        }
      } catch (vehicleError) {
        console.error("Failed to fetch updated vehicle data:", vehicleError);
      }

      Alert.alert("Success", `Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update status");
    }
  };

  // Mark vehicle returned to station (October 20, 2025)
  const markReturnedToStation = async () => {
    if (!vehicle || !currentAssignment) return;

    try {
      // FIRST: Update assignment status to "returned" - this sets response.returnedAt
      // This is critical - the backend query excludes assignments with returnedAt set
      await apiClient.updateAssignmentStatus(currentAssignment._id, "returned");

      console.log("✅ Assignment status updated to 'returned'");

      // The backend will automatically:
      // 1. Set vehicle status to "available"
      // 2. Emit WebSocket events (assignment_status_update, vehicle_status_update)

      // Clear local state immediately for better UX
      setCurrentAssignment(null);
      setHasCompletedAssignment(false);

      // Refresh to ensure we're in sync AND update history to show the completed assignment
      await Promise.all([
        fetchVehicle(),
        fetchCurrentAssignment(),
        fetchAssignmentHistory(), // Auto-refresh history to show newly completed assignment
      ]);

      Alert.alert("Success", "Vehicle marked as returned to station and ready");
    } catch (error) {
      console.error("Error marking returned to station:", error);
      Alert.alert("Error", "Failed to mark vehicle as returned");
    }
  };

  // Toggle vehicle readiness (October 20, 2025)
  const toggleVehicleReadiness = async () => {
    if (!vehicle) return;

    // If during active assignment, show warning
    if (currentAssignment) {
      Alert.alert(
        "Readiness Unavailable",
        "Vehicle readiness cannot be changed during an active assignment.\n\nIf you are experiencing an emergency, vehicle malfunction, or any situation requiring immediate attention, please contact the dispatch center immediately via radio or phone.",
        [{ text: "Understood", style: "default" }]
      );
      return;
    }

    const currentReadiness = vehicle.readiness?.isReady ?? false;
    const newReadiness = !currentReadiness;

    // If marking not ready, ask for reason
    if (!newReadiness) {
      Alert.prompt(
        "Mark Vehicle Not Ready",
        "Please provide a reason:",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Submit",
            onPress: async (reason: string | undefined) => {
              if (!reason || reason.trim() === "") {
                Alert.alert("Error", "Please provide a reason");
                return;
              }
              await updateVehicleReadiness(false, reason.trim());
            },
          },
        ],
        "plain-text"
      );
    } else {
      // Marking ready - no reason needed
      await updateVehicleReadiness(true, null);
    }
  };

  // Update vehicle readiness via API
  const updateVehicleReadiness = async (
    isReady: boolean,
    notReadyReason: string | null
  ) => {
    if (!vehicle) return;

    setReadinessLoading(true);
    try {
      await apiClient.updateVehicleReadiness(vehicle._id, {
        isReady,
        notReadyReason,
      });

      // Update local vehicle state
      setVehicle({
        ...vehicle,
        readiness: {
          isReady,
          notReadyReason,
          lastReadyUpdate: new Date().toISOString(),
        },
      });

      Alert.alert(
        "Success",
        `Vehicle marked ${isReady ? "ready" : "not ready"}`
      );
    } catch (error) {
      console.error("Error updating vehicle readiness:", error);
      Alert.alert("Error", "Failed to update vehicle readiness");
    } finally {
      setReadinessLoading(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case ASSIGNMENT_STATUS.ASSIGNED:
        return colors.statusAssigned; // Yellow
      case ASSIGNMENT_STATUS.ACCEPTED:
        return colors.statusAccepted; // Green
      case ASSIGNMENT_STATUS.EN_ROUTE:
        return colors.statusEnRoute; // Orange
      case ASSIGNMENT_STATUS.ON_SCENE:
        return colors.statusOnScene; // Red
      case ASSIGNMENT_STATUS.COMPLETED:
        return colors.success; // Green (completed successfully)
      case ASSIGNMENT_STATUS.RETURNED:
        return colors.info; // Blue (returned to station)
      case ASSIGNMENT_STATUS.CANCELLED:
        return colors.error; // Red for cancelled
      default:
        return colors.textMuted;
    }
  };

  // Get priority badge color (priority, not severity)
  const getSeverityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return colors.priorityCritical;
      case "high":
        return colors.priorityHigh;
      case "medium":
        return colors.priorityMedium;
      case "low":
        return colors.priorityLow;
      default:
        return colors.textSecondary;
    }
  };

  // Open navigation to incident location
  const openNavigation = async () => {
    if (!currentAssignment?.incident?.incidentId?.location?.coordinates) {
      Alert.alert("Error", "Incident location not available");
      return;
    }

    const coords =
      currentAssignment.incident.incidentId.location.coordinates.coordinates;
    const [longitude, latitude] = coords; // GeoJSON format

    // Build Google Maps URL
    const label = encodeURIComponent(
      currentAssignment.incident.incidentId.location.address ||
        "Incident Location"
    );
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${label}`,
      android: `google.navigation:q=${latitude},${longitude}&label=${label}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web browser
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error("Error opening navigation:", error);
      Alert.alert("Error", "Unable to open navigation app");
    }
  };

  // Get next status button
  const getNextStatusButton = () => {
    console.log(
      `📱 🔄 getNextStatusButton called - currentAssignment:`,
      currentAssignment
        ? {
            id: currentAssignment._id,
            status: currentAssignment.status,
            responseStatus: currentAssignment.response?.status,
          }
        : "null"
    );

    if (!currentAssignment) {
      console.log(`📱 No currentAssignment - returning null`);
      return null;
    }

    // Use response.status as primary (more up-to-date), fallback to top-level status
    const status =
      currentAssignment.response?.status || currentAssignment.status;

    console.log(
      `📱 getNextStatusButton - derived status: '${status}', type: ${typeof status}`
    );
    console.log(`📱 getNextStatusButton - assignment fields:`, {
      status: currentAssignment.status,
      "response.status": currentAssignment.response?.status,
    });
    console.log(`📱 getNextStatusButton - ASSIGNMENT_STATUS constants:`, {
      ACCEPTED: ASSIGNMENT_STATUS.ACCEPTED,
      EN_ROUTE: ASSIGNMENT_STATUS.EN_ROUTE,
      ON_SCENE: ASSIGNMENT_STATUS.ON_SCENE,
      COMPLETED: ASSIGNMENT_STATUS.COMPLETED,
    });

    if (status === ASSIGNMENT_STATUS.ACCEPTED) {
      console.log(`📱 Returning "Start En Route" button for status: ${status}`);
      return (
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: colors.warning }]}
          onPress={() => updateStatus(ASSIGNMENT_STATUS.EN_ROUTE)}
        >
          <MaterialCommunityIcons
            name="truck-fast"
            size={20}
            color={colors.textOnPrimary}
          />
          <Text style={styles.statusButtonText}>Start En Route</Text>
        </TouchableOpacity>
      );
    }

    if (status === ASSIGNMENT_STATUS.EN_ROUTE) {
      console.log(
        `📱 Returning "Arrived On Scene" button for status: ${status}`
      );
      return (
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: colors.primary }]}
          onPress={() => updateStatus(ASSIGNMENT_STATUS.ON_SCENE)}
        >
          <MaterialIcons name="place" size={20} color={colors.textOnPrimary} />
          <Text style={styles.statusButtonText}>Arrived On Scene</Text>
        </TouchableOpacity>
      );
    }

    if (status === ASSIGNMENT_STATUS.ON_SCENE) {
      console.log(
        `📱 Returning "Complete Assignment" button for status: ${status}`
      );
      return (
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: colors.success }]}
          onPress={() => updateStatus(ASSIGNMENT_STATUS.COMPLETED)}
        >
          <MaterialIcons
            name="check-circle"
            size={20}
            color={colors.textOnPrimary}
          />
          <Text style={styles.statusButtonText}>Complete Assignment</Text>
        </TouchableOpacity>
      );
    }

    // Check if assignment is completed to show "Returned to Station" button
    console.log(
      `📱 Checking for completed status - current status: '${status}', COMPLETED constant: '${ASSIGNMENT_STATUS.COMPLETED}'`
    );

    if (status === ASSIGNMENT_STATUS.COMPLETED) {
      console.log(`📱 Assignment is completed! Checking vehicle status...`);

      // After completion, show "Returned to Station" button when vehicle is returning
      console.log(
        `📱 Button check: Assignment status='${status}', Vehicle status='${vehicle?.status?.currentStatus}', hasCompletedAssignment=${hasCompletedAssignment}`
      );
      console.log(
        `📱 Current assignment object:`,
        currentAssignment
          ? {
              id: currentAssignment._id,
              status: currentAssignment.status,
              incidentId: currentAssignment.incident?.incidentId?._id || "N/A",
            }
          : "null"
      );

      // Check conditions: Either vehicle is returning OR hasCompletedAssignment flag is true
      // The flag is set immediately when assignment_status_update event fires with status="completed"
      const assignmentIsCompleted = status === ASSIGNMENT_STATUS.COMPLETED;
      const vehicleIsReturning = vehicle?.status?.currentStatus === "returning";
      const shouldShowButton =
        assignmentIsCompleted && (vehicleIsReturning || hasCompletedAssignment);

      console.log(
        `📱 Condition check: assignmentIsCompleted=${assignmentIsCompleted}, vehicleIsReturning=${vehicleIsReturning}, hasCompletedAssignment=${hasCompletedAssignment}`
      );
      console.log(
        `📱 Vehicle object status:`,
        vehicle?.status || "Vehicle status undefined"
      );

      if (shouldShowButton) {
        console.log(
          `📱 ✅ Showing "Returned to Station" button - Assignment: ${status}, Vehicle: ${vehicle?.status?.currentStatus}, Flag: ${hasCompletedAssignment}`
        );
        return (
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: colors.success }]}
            onPress={markReturnedToStation}
          >
            <MaterialIcons name="home" size={20} color={colors.textOnPrimary} />
            <Text style={styles.statusButtonText}>Returned to Station</Text>
          </TouchableOpacity>
        );
      }

      console.log(
        `📱 ❌ "Returned to Station" button not shown. Conditions not met.`
      );
      console.log(
        `📱 Missing conditions: shouldShowButton=${shouldShowButton} (needs assignmentIsCompleted AND (vehicleIsReturning OR hasCompletedAssignment))`
      );
    } else {
      console.log(
        `📱 Assignment not completed yet. Current status: '${status}', needed: '${ASSIGNMENT_STATUS.COMPLETED}'`
      );
    }

    return null;
  };

  // Handle logout with validation (October 20, 2025)
  const handleLogoutPress = () => {
    // Check if there's an active assignment
    if (currentAssignment) {
      Alert.alert(
        "Active Assignment",
        "You cannot logout while you have an active assignment. Please complete or cancel your assignment first.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    // Check if vehicle is returning to station
    if (vehicle?.status?.currentStatus === "returning") {
      Alert.alert(
        "Return to Station Required",
        "You must mark your vehicle as 'Returned to Station' before logging out.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    // Confirm logout
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout? Your vehicle will be marked as 'Not Ready'.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: handleConfirmedLogout,
        },
      ]
    );
  };

  // Handle confirmed logout with vehicle readiness update (October 21, 2025)
  const handleConfirmedLogout = async () => {
    try {
      // Mark vehicle as not ready before logout if vehicle exists
      if (vehicle?._id) {
        console.log(
          `🚗 Marking vehicle ${vehicle._id} as not ready before logout`
        );
        console.log(
          `🚗 Current vehicle readiness before logout: ${vehicle.readiness?.isReady}`
        );

        const result = await apiClient.updateVehicleReadiness(vehicle._id, {
          isReady: false,
          notReadyReason: "Crew logged out - Vehicle not ready",
        });

        console.log("✅ Vehicle readiness update result:", result);
        console.log("✅ Vehicle marked as not ready on logout");
      } else {
        console.log("⚠️ No vehicle found to mark as not ready during logout");
      }
    } catch (error: any) {
      console.error("❌ Failed to mark vehicle not ready on logout:", error);
      console.error("Error details:", error.response?.data || error.message);
      // Continue with logout even if this fails
    }

    // Call parent logout function
    onLogout();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.welcomeText}>
              {crew.personal.firstName} {crew.personal.lastName}
            </Text>
            <View style={styles.roleContainer}>
              <MaterialCommunityIcons
                name="shield-star"
                size={14}
                color={colors.secondary100}
              />
              <Text style={styles.roleText}>
                Crew Leader • {crew.professional.specialization}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPress}
        >
          <MaterialIcons name="logout" size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      {/* WebSocket Connection Status */}
      <View style={styles.connectionStatus}>
        <View style={styles.connectionIndicator}>
          <MaterialIcons
            name={isConnected ? "wifi" : "wifi-off"}
            size={16}
            color={isConnected ? colors.success : colors.error}
          />
          <Text
            style={[
              styles.connectionText,
              { color: isConnected ? colors.success : colors.error },
            ]}
          >
            {isConnected ? "Connected to Dispatch" : "Connection Lost"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Vehicle Information */}
        {vehicle && (
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <MaterialCommunityIcons
                name="car-emergency"
                size={22}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>Assigned Vehicle</Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleText}>
                <Text style={styles.label}>Plate:</Text>{" "}
                {vehicle.registration?.plateNumber || "N/A"}
              </Text>
              <Text style={styles.vehicleText}>
                <Text style={styles.label}>Type:</Text>{" "}
                {vehicle.registration?.vehicleType || "N/A"}
              </Text>
              <View
                style={[
                  styles.vehicleStatusBadge,
                  {
                    backgroundColor:
                      vehicle.status?.currentStatus === "available"
                        ? "#d1fae5" // green-100
                        : vehicle.status?.currentStatus === "assigned"
                        ? "#fef3c7" // yellow-100 (matches web app)
                        : vehicle.status?.currentStatus === "en_route"
                        ? "#fed7aa" // orange-100 (matches web app)
                        : vehicle.status?.currentStatus === "on_scene"
                        ? "#fee2e2" // red-100 (matches web app)
                        : vehicle.status?.currentStatus === "returning"
                        ? "#dbeafe" // blue-100 (matches web app)
                        : "#f3f4f6", // gray-100 (default)
                  },
                ]}
              >
                <Text
                  style={[
                    styles.vehicleStatusText,
                    {
                      color:
                        vehicle.status?.currentStatus === "available"
                          ? "#065f46" // green-900
                          : vehicle.status?.currentStatus === "assigned"
                          ? "#92400e" // yellow-900 (matches web app)
                          : vehicle.status?.currentStatus === "en_route"
                          ? "#9a3412" // orange-900 (matches web app)
                          : vehicle.status?.currentStatus === "on_scene"
                          ? "#991b1b" // red-900 (matches web app)
                          : vehicle.status?.currentStatus === "returning"
                          ? "#1e3a8a" // blue-900 (matches web app)
                          : "#1f2937", // gray-900 (default)
                    },
                  ]}
                >
                  {vehicle.status?.currentStatus?.toUpperCase() || "UNKNOWN"}
                </Text>
              </View>

              {/* Vehicle Readiness Controls (October 20, 2025) */}
              <TouchableOpacity
                style={[
                  styles.readinessButton,
                  {
                    backgroundColor: vehicle.readiness?.isReady
                      ? colors.success
                      : colors.error,
                  },
                ]}
                onPress={toggleVehicleReadiness}
                disabled={readinessLoading || !!currentAssignment}
              >
                <MaterialIcons
                  name={vehicle.readiness?.isReady ? "check-circle" : "error"}
                  size={16}
                  color={colors.textOnPrimary}
                />
                <Text style={styles.readinessButtonText}>
                  {readinessLoading
                    ? "Updating..."
                    : vehicle.readiness?.isReady
                    ? "Ready"
                    : `Not Ready${
                        vehicle.readiness?.notReadyReason
                          ? `: ${vehicle.readiness.notReadyReason}`
                          : ""
                      }`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Current Assignment */}
        {currentAssignment ? (
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <MaterialCommunityIcons
                name="clipboard-alert"
                size={22}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>Current Assignment</Text>
            </View>

            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getStatusColor(
                    currentAssignment.response?.status ||
                      currentAssignment.status ||
                      "assigned"
                  ),
                },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {(
                  currentAssignment.response?.status || currentAssignment.status
                )?.toUpperCase() || "ASSIGNED"}
              </Text>
            </View>

            {/* Incident Details */}
            <View style={styles.incidentDetails}>
              <Text style={styles.incidentId}>
                {currentAssignment.incident?.incidentId?.incidentId || "N/A"}
              </Text>

              <Text style={styles.incidentType}>
                {currentAssignment.incident?.incidentId?.incidentType
                  ? `${currentAssignment.incident.incidentId.incidentType
                      .charAt(0)
                      .toUpperCase()}${currentAssignment.incident.incidentId.incidentType.slice(
                      1
                    )}`
                  : "Unknown"}
                {currentAssignment.incident?.incidentId?.incidentCategory &&
                  ` - ${currentAssignment.incident.incidentId.incidentCategory.replace(
                    /_/g,
                    " "
                  )}`}
              </Text>

              <View style={styles.incidentLocationContainer}>
                <MaterialIcons
                  name="place"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.incidentLocation}>
                  {currentAssignment.incident?.incidentId?.location?.address ||
                    "Location not available"}
                </Text>
              </View>

              {currentAssignment.incident?.incidentId?.description && (
                <Text style={styles.incidentDescription}>
                  {currentAssignment.incident.incidentId.description}
                </Text>
              )}

              {/* Severity Badge */}
              <View
                style={[
                  styles.severityBadge,
                  {
                    backgroundColor: getSeverityColor(
                      currentAssignment.incident?.incidentId?.severity ||
                        "medium"
                    ),
                  },
                ]}
              >
                <Text style={styles.severityText}>
                  {(
                    currentAssignment.incident?.incidentId?.severity || "medium"
                  ).toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Status Update Button */}
            {getNextStatusButton()}

            {/* Get Directions Button - Only show if assignment is not completed */}
            {currentAssignment.incident?.incidentId?.location?.coordinates &&
              (currentAssignment.response?.status ||
                currentAssignment.status) !== ASSIGNMENT_STATUS.COMPLETED && (
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: colors.info,
                      marginTop: spacing.sm,
                    },
                  ]}
                  onPress={() => openNavigation()}
                >
                  <MaterialIcons
                    name="directions"
                    size={20}
                    color={colors.textOnPrimary}
                  />
                  <Text style={styles.statusButtonText}>Get Directions</Text>
                </TouchableOpacity>
              )}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={22}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>Assignment Status</Text>
            </View>
            <View style={styles.noAssignment}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={64}
                color={colors.textMuted}
              />
              <Text style={styles.noAssignmentText}>No Active Assignment</Text>
              <Text style={styles.noAssignmentSubtext}>
                Waiting for dispatcher assignment...
              </Text>
            </View>
          </View>
        )}

        {/* Assignment History */}
        <View style={styles.card}>
          <View style={styles.cardTitleContainer}>
            <MaterialCommunityIcons
              name="history"
              size={22}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>Recent Activity</Text>
          </View>
          {assignmentHistory.length > 0 ? (
            assignmentHistory.map((assignment, index) => (
              <View
                key={assignment._id}
                style={[
                  styles.historyItem,
                  index !== assignmentHistory.length - 1 &&
                    styles.historyItemBorder,
                ]}
              >
                <View style={styles.historyHeader}>
                  <Text style={styles.historyIncidentId}>
                    {assignment.incident?.incidentId?.incidentId || "N/A"}
                  </Text>
                  <View
                    style={[
                      styles.historyStatusBadge,
                      {
                        backgroundColor: getSeverityColor(
                          assignment.incident?.incidentId?.severity || "medium"
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.historyStatusText}>
                      {(
                        assignment.incident?.incidentId?.severity || "medium"
                      ).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyIncidentType}>
                  {assignment.incident?.incidentId?.incidentType
                    ? `${assignment.incident.incidentId.incidentType
                        .charAt(0)
                        .toUpperCase()}${assignment.incident.incidentId.incidentType.slice(
                        1
                      )}`
                    : "Unknown"}
                </Text>
                <Text style={styles.historyLocation}>
                  {assignment.incident?.incidentId?.location?.address ||
                    "Location not available"}
                </Text>
                {assignment.response?.returnedAt && (
                  <Text style={styles.historyDate}>
                    Completed:{" "}
                    {new Date(
                      assignment.response.returnedAt
                    ).toLocaleDateString()}{" "}
                    {new Date(
                      assignment.response.returnedAt
                    ).toLocaleTimeString()}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.placeholderText}>
              No recent activity to display
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Assignment Notification Modal */}
      {pendingAssignment && (
        <AssignmentNotificationModal
          visible={showNotification}
          assignment={pendingAssignment}
          onAccept={handleAcceptAssignment}
          onDecline={handleDeclineAssignment}
          onTimeout={handleNotificationTimeout}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    ...shadows.md,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textOnPrimary,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    color: colors.secondary100,
    fontWeight: typography.fontWeight.medium,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  connectionStatus: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  connectionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  connectionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    flex: 1,
  },
  vehicleInfo: {
    gap: spacing.sm,
  },
  vehicleText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  label: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  vehicleStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  vehicleStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  incidentDetails: {
    gap: spacing.sm,
  },
  incidentId: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  incidentType: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  incidentLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  incidentLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  incidentDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  severityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  severityText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  statusButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.sm,
  },
  statusButtonText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  noAssignment: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  noAssignmentText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  noAssignmentSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  placeholderText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  // October 20, 2025 - Readiness toggle button styles
  readinessButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
    ...shadows.sm,
  },
  readinessButtonText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  // Assignment history styles
  historyItem: {
    paddingVertical: spacing.md,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  historyIncidentId: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  historyStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  historyStatusText: {
    color: colors.textOnPrimary,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  historyIncidentType: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  historyLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  historyDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
});

export default DashboardScreen;
