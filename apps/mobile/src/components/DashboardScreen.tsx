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
} from "react-native";
import { websocketService } from "../services/websocketService";
import { apiClient } from "../services/apiClient";
import { ASSIGNMENT_STATUS } from "../constants";
import AssignmentNotificationModal from "./AssignmentNotificationModal";

interface DashboardScreenProps {
  user: any;
  crew: any; // ✅ ADDED - Crew data from login
  onLogout: () => void;
}

interface Assignment {
  _id: string;
  incident: {
    incidentId: string;
    incidentType: string;
    location: {
      address: string;
      coordinates: [number, number];
    };
    description: string;
    severity: string;
  };
  status: string;
  assignedAt: string;
}

interface Vehicle {
  vehicleId: string;
  plateNumber: string;
  vehicleType: string;
  status: string;
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
      console.log("🚨 Assignment notification received:", data);
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
  }, []);

  // Fetch current assignment
  const fetchCurrentAssignment = async () => {
    try {
      const response = await apiClient.getCrewAssignments(crew._id);
      const assignments = response.data.data;

      // Find first non-completed assignment
      const activeAssignment = assignments.find(
        (a: Assignment) =>
          a.status !== ASSIGNMENT_STATUS.COMPLETED &&
          a.status !== ASSIGNMENT_STATUS.CANCELLED
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
    // Assignment remains null, waiting for next one
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
        return "#3b82f6"; // Blue
      case ASSIGNMENT_STATUS.ACCEPTED:
        return "#10b981"; // Green
      case ASSIGNMENT_STATUS.EN_ROUTE:
        return "#f59e0b"; // Amber
      case ASSIGNMENT_STATUS.ON_SCENE:
        return "#ef4444"; // Red
      case ASSIGNMENT_STATUS.COMPLETED:
        return "#6b7280"; // Gray
      default:
        return "#9ca3af";
    }
  };

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "#dc2626";
      case "high":
        return "#f59e0b";
      case "medium":
        return "#3b82f6";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  // Get next status button
  const getNextStatusButton = () => {
    if (!currentAssignment) return null;

    const { status } = currentAssignment;

    if (status === ASSIGNMENT_STATUS.ACCEPTED) {
      return (
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: "#f59e0b" }]}
          onPress={() => updateStatus(ASSIGNMENT_STATUS.EN_ROUTE)}
        >
          <Text style={styles.statusButtonText}>🚗 Start En Route</Text>
        </TouchableOpacity>
      );
    }

    if (status === ASSIGNMENT_STATUS.EN_ROUTE) {
      return (
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: "#ef4444" }]}
          onPress={() => updateStatus(ASSIGNMENT_STATUS.ON_SCENE)}
        >
          <Text style={styles.statusButtonText}>📍 Arrived On Scene</Text>
        </TouchableOpacity>
      );
    }

    if (status === ASSIGNMENT_STATUS.ON_SCENE) {
      return (
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: "#10b981" }]}
          onPress={() => updateStatus(ASSIGNMENT_STATUS.COMPLETED)}
        >
          <Text style={styles.statusButtonText}>✅ Complete Assignment</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>
            👋 Welcome back, {crew.personal.firstName}!
          </Text>
          <Text style={styles.roleText}>
            🎖️ Crew Leader • {crew.professional.specialization}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* WebSocket Connection Status */}
      <View style={styles.connectionStatus}>
        <View
          style={[
            styles.connectionDot,
            { backgroundColor: isConnected ? "#10b981" : "#ef4444" },
          ]}
        />
        <Text style={styles.connectionText}>
          {isConnected ? "Connected to dispatch" : "Disconnected"}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Vehicle Information */}
        {vehicle && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚑 Assigned Vehicle</Text>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleText}>
                <Text style={styles.label}>Plate:</Text> {vehicle.plateNumber}
              </Text>
              <Text style={styles.vehicleText}>
                <Text style={styles.label}>Type:</Text> {vehicle.vehicleType}
              </Text>
              <View
                style={[
                  styles.vehicleStatusBadge,
                  {
                    backgroundColor:
                      vehicle.status === "available"
                        ? "#d1fae5"
                        : vehicle.status === "on_duty"
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
                        vehicle.status === "available"
                          ? "#065f46"
                          : vehicle.status === "on_duty"
                          ? "#92400e"
                          : "#991b1b",
                    },
                  ]}
                >
                  {vehicle.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Current Assignment */}
        {currentAssignment ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚨 Current Assignment</Text>

            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(currentAssignment.status) },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {currentAssignment.status.toUpperCase()}
              </Text>
            </View>

            {/* Incident Details */}
            <View style={styles.incidentDetails}>
              <Text style={styles.incidentId}>
                {currentAssignment.incident.incidentId}
              </Text>

              <Text style={styles.incidentType}>
                {currentAssignment.incident.incidentType}
              </Text>

              <Text style={styles.incidentLocation}>
                📍 {currentAssignment.incident.location.address}
              </Text>

              {currentAssignment.incident.description && (
                <Text style={styles.incidentDescription}>
                  {currentAssignment.incident.description}
                </Text>
              )}

              {/* Severity Badge */}
              <View
                style={[
                  styles.severityBadge,
                  {
                    backgroundColor: getSeverityColor(
                      currentAssignment.incident.severity
                    ),
                  },
                ]}
              >
                <Text style={styles.severityText}>
                  {currentAssignment.incident.severity.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Status Update Button */}
            {getNextStatusButton()}
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
    backgroundColor: "#f3f4f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  roleText: {
    fontSize: 14,
    color: "#dbeafe",
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e40af",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    color: "#dbeafe",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  vehicleInfo: {
    gap: 8,
  },
  vehicleText: {
    fontSize: 16,
    color: "#4b5563",
  },
  label: {
    fontWeight: "600",
    color: "#1f2937",
  },
  vehicleStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  vehicleStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  incidentDetails: {
    gap: 8,
  },
  incidentId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  incidentType: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3b82f6",
  },
  incidentLocation: {
    fontSize: 14,
    color: "#6b7280",
  },
  incidentDescription: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginTop: 4,
  },
  severityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  severityText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  statusButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  statusButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  noAssignment: {
    alignItems: "center",
    paddingVertical: 32,
  },
  noAssignmentIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noAssignmentText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4b5563",
  },
  noAssignmentSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  placeholderText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 24,
  },
});

export default DashboardScreen;
