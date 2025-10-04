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
import { ASSIGNMENT_STATUS } from "../constants";
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
  crew: any; // ✅ ADDED - Crew data from login
  onLogout: () => void;
}

interface Assignment {
  _id: string;
  incident: {
    incidentId: {
      _id: string;
      incidentId: string;
      classification?: {
        incidentType: string;
        category: string;
      };
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
      priority?: string;
      status?: string;
    };
  };
  response?: {
    status: string;
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
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

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

      // Refresh current assignment if it's the one that was updated
      if (currentAssignment && currentAssignment._id === data.assignmentId) {
        fetchCurrentAssignment();
      }
    });

    // Cleanup listeners on unmount
    return () => {
      console.log("🧹 Cleaning up WebSocket listeners");
    };
  }, [crew._id, currentAssignment]);

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
        "This app needs location access to track your position during assignments. Please enable location permissions in settings.",
        [{ text: "OK" }]
      );
    }
  };

  // Manage GPS tracking based on assignment status
  useEffect(() => {
    const manageLocationTracking = async () => {
      if (!currentAssignment) {
        // No assignment - stop tracking if active
        if (locationService.isCurrentlyTracking()) {
          locationService.stopTracking();
          console.log("🛑 Stopped location tracking (no assignment)");
        }
        return;
      }

      const status =
        currentAssignment.response?.status || currentAssignment.status;

      // Start tracking when en_route, stop otherwise
      if (status === ASSIGNMENT_STATUS.EN_ROUTE) {
        if (!locationService.isCurrentlyTracking()) {
          const started = await locationService.startTracking(crew._id);
          if (started) {
            console.log("🎯 Started location tracking (en route)");
          } else {
            Alert.alert(
              "Location Tracking Failed",
              "Unable to start location tracking. Please check your location permissions.",
              [{ text: "OK" }]
            );
          }
        }
      } else {
        // Stop tracking for other statuses
        if (locationService.isCurrentlyTracking()) {
          locationService.stopTracking();
          console.log("🛑 Stopped location tracking (status changed)");
        }
      }
    };

    manageLocationTracking();
  }, [currentAssignment, crew._id]);

  // Fetch current assignment
  const fetchCurrentAssignment = async () => {
    try {
      const response = await apiClient.getCrewAssignments(crew._id);
      const assignments = response.data.data;

      // Find first active assignment (exclude completed, cancelled, and declined)
      const activeAssignment = assignments.find(
        (a: Assignment) =>
          a.status !== ASSIGNMENT_STATUS.COMPLETED &&
          a.status !== ASSIGNMENT_STATUS.CANCELLED &&
          a.status !== ASSIGNMENT_STATUS.DECLINED
      );

      setCurrentAssignment(activeAssignment || null);
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

  // Load all dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCurrentAssignment(), fetchVehicle()]);
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
      await apiClient.updateAssignmentStatus(currentAssignment._id, newStatus);

      // Update local state
      setCurrentAssignment({
        ...currentAssignment,
        status: newStatus,
      });

      Alert.alert("Success", `Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update status");
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case ASSIGNMENT_STATUS.ASSIGNED:
        return colors.statusAssigned;
      case ASSIGNMENT_STATUS.ACCEPTED:
        return colors.statusAccepted;
      case ASSIGNMENT_STATUS.EN_ROUTE:
        return colors.statusEnRoute;
      case ASSIGNMENT_STATUS.ON_SCENE:
        return colors.statusOnScene;
      case ASSIGNMENT_STATUS.COMPLETED:
        return colors.statusCompleted;
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
    if (!currentAssignment) return null;

    const status =
      currentAssignment.response?.status || currentAssignment.status;

    if (status === ASSIGNMENT_STATUS.ACCEPTED) {
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

    return null;
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
          <View style={styles.avatarContainer}>
            <MaterialIcons
              name="person"
              size={24}
              color={colors.textOnPrimary}
            />
          </View>
          <View>
            <Text style={styles.welcomeText}>
              Welcome back, {crew.personal.firstName}!
            </Text>
            <View style={styles.roleContainer}>
              <MaterialCommunityIcons
                name="shield-star"
                size={14}
                color={colors.secondary}
              />
              <Text style={styles.roleText}>
                Crew Leader • {crew.professional.specialization}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <MaterialIcons name="logout" size={20} color={colors.textOnPrimary} />
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
                name="ambulance"
                size={20}
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
                        ? "#d1fae5"
                        : vehicle.status?.currentStatus === "assigned" ||
                          vehicle.status?.currentStatus === "en_route"
                        ? "#fef3c7"
                        : "#fee2e2",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.vehicleStatusText,
                    {
                      color:
                        vehicle.status?.currentStatus === "available"
                          ? "#065f46"
                          : vehicle.status?.currentStatus === "assigned" ||
                            vehicle.status?.currentStatus === "en_route"
                          ? "#92400e"
                          : "#991b1b",
                    },
                  ]}
                >
                  {vehicle.status?.currentStatus?.toUpperCase() || "UNKNOWN"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Current Assignment */}
        {currentAssignment ? (
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <MaterialIcons
                name="emergency"
                size={20}
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
                {currentAssignment.incident?.incidentId?.classification
                  ?.incidentType || "Unknown Incident"}
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

              {/* Priority Badge */}
              <View
                style={[
                  styles.severityBadge,
                  {
                    backgroundColor: getSeverityColor(
                      currentAssignment.incident?.incidentId?.priority ||
                        "medium"
                    ),
                  },
                ]}
              >
                <Text style={styles.severityText}>
                  {currentAssignment.incident?.incidentId?.priority?.toUpperCase() ||
                    "MEDIUM"}
                </Text>
              </View>
            </View>

            {/* Status Update Button */}
            {getNextStatusButton()}

            {/* Get Directions Button */}
            {currentAssignment.incident?.incidentId?.location?.coordinates && (
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  { backgroundColor: colors.secondary, marginTop: spacing.sm },
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
            <Text style={styles.cardTitle}>📋 Assignment Status</Text>
            <View style={styles.noAssignment}>
              <Text style={styles.noAssignmentIcon}>⏳</Text>
              <Text style={styles.noAssignmentText}>No Active Assignment</Text>
              <Text style={styles.noAssignmentSubtext}>
                Waiting for dispatcher assignment...
              </Text>
            </View>
          </View>
        )}

        {/* Assignment History Placeholder */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📜 Recent Activity</Text>
          <Text style={styles.placeholderText}>
            Assignment history will appear here
          </Text>
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
    paddingVertical: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    ...shadows.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary700,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
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
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary700,
    justifyContent: "center",
    alignItems: "center",
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
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
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
  },
  noAssignmentIcon: {
    fontSize: typography.fontSize.xxxl + 18,
    marginBottom: spacing.md,
  },
  noAssignmentText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
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
});

export default DashboardScreen;
