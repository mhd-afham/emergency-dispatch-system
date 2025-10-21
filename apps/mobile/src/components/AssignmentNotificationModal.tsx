import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ASSIGNMENT_STATUS, DECLINE_REASONS } from "../constants";
import { apiClient } from "../services/apiClient";

interface AssignmentNotificationModalProps {
  visible: boolean;
  assignment: any;
  onAccept: () => void;
  onDecline: () => void;
  onTimeout: () => void;
}

export default function AssignmentNotificationModal({
  visible,
  assignment,
  onAccept,
  onDecline,
  onTimeout,
}: AssignmentNotificationModalProps) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [declineReason, setDeclineReason] = useState("vehicle_issue");
  const [declineNotes, setDeclineNotes] = useState("");
  const progressAnim = new Animated.Value(1);

  useEffect(() => {
    if (!visible) {
      setTimeLeft(30);
      setShowDeclineReason(false);
      setDeclineReason("vehicle_issue");
      setDeclineNotes("");
      progressAnim.setValue(1);
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 30000,
      useNativeDriver: false,
    }).start();

    return () => {
      clearInterval(timer);
      progressAnim.stopAnimation();
    };
  }, [visible]);

  const handleTimeout = () => {
    Alert.alert(
      "Assignment Timeout",
      "You did not respond in time. The assignment will be reassigned to another crew.",
      [{ text: "OK", onPress: onTimeout }]
    );
  };

  const handleAccept = async () => {
    if (isProcessing || !assignment) return;

    setIsProcessing(true);
    try {
      console.log("📱 Accepting assignment:", assignment.assignmentId);

      const response = await apiClient.updateAssignmentStatus(
        assignment.assignmentId,
        ASSIGNMENT_STATUS.ACCEPTED
      );

      if (response.data.success) {
        // Reset processing state before calling callback (October 20, 2025)
        setIsProcessing(false);

        Alert.alert(
          "Assignment Accepted",
          "You have accepted the assignment. Please proceed to the incident location.",
          [{ text: "OK", onPress: onAccept }]
        );
      } else {
        throw new Error(response.data.message || "Failed to accept assignment");
      }
    } catch (error: any) {
      console.error("❌ Error accepting assignment:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to accept assignment. Please try again."
      );
      setIsProcessing(false);
    }
  };

  const handleDeclineConfirm = async () => {
    if (isProcessing || !assignment) return;

    if (!declineReason) {
      Alert.alert("Error", "Please select a reason for declining");
      return;
    }

    setIsProcessing(true);
    try {
      console.log(
        "📱 Declining assignment:",
        assignment.assignmentId,
        "Reason:",
        declineReason
      );

      const reasonLabel =
        DECLINE_REASONS.find((r) => r.value === declineReason)?.label ||
        declineReason;
      const fullNotes = declineNotes
        ? `${reasonLabel}: ${declineNotes}`
        : reasonLabel;

      const response = await apiClient.updateAssignmentStatus(
        assignment.assignmentId,
        ASSIGNMENT_STATUS.DECLINED,
        fullNotes
      );

      if (response.data.success) {
        // Reset processing state and decline form before calling callback
        setIsProcessing(false);
        setShowDeclineReason(false);
        setDeclineReason("vehicle_issue");
        setDeclineNotes("");

        Alert.alert(
          "Assignment Declined",
          "The dispatcher has been notified. Another crew will be assigned.",
          [{ text: "OK", onPress: onDecline }]
        );
      } else {
        throw new Error(
          response.data.message || "Failed to decline assignment"
        );
      }
    } catch (error: any) {
      console.error("❌ Error declining assignment:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to decline assignment. Please try again."
      );
      setIsProcessing(false);
      setShowDeclineReason(false);
    }
  };

  const handleDeclinePress = () => {
    setShowDeclineReason(true);
  };

  const handleCancelDecline = () => {
    setShowDeclineReason(false);
    setDeclineReason("vehicle_issue");
    setDeclineNotes("");
  };

  if (!assignment) return null;

  const incident = assignment.incident || {};
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const getTimerColor = () => {
    if (timeLeft > 20) return "#10b981"; // Green
    if (timeLeft > 10) return "#EAB308"; // Yellow (matches web app assigned color)
    return "#ef4444"; // Red
  };

  const getSeverityColor = (severity: string) => {
    const severityMap: { [key: string]: string } = {
      critical: "#dc2626", // red-600 (matches web app)
      high: "#ea580c", // orange-600 (matches web app)
      medium: "#d97706", // amber-600 (matches web app)
      low: "#059669", // emerald-600 (matches web app)
    };
    return severityMap[severity?.toLowerCase()] || "#6b7280";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Timer and Progress Bar */}
          <View style={styles.timerContainer}>
            <View style={styles.timerHeader}>
              <Text style={styles.timerLabel}>Response Required</Text>
              <Text style={[styles.timerText, { color: getTimerColor() }]}>
                {timeLeft}s
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { width: progressWidth, backgroundColor: getTimerColor() },
                ]}
              />
            </View>
          </View>

          {/* Incident Details */}
          {!showDeclineReason ? (
            <ScrollView style={styles.contentContainer}>
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={24}
                    color="#dc2626"
                  />
                  <Text style={styles.title}>New Emergency Assignment</Text>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(incident.severity) },
                  ]}
                >
                  <Text style={styles.severityText}>
                    {incident.severity?.toUpperCase() || "URGENT"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Incident ID:</Text>
                  <Text style={styles.detailValue}>
                    {incident.incidentId || "N/A"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {incident.incidentType || "Emergency"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>
                    {incident.location?.address || "Location not available"}
                  </Text>
                </View>

                {incident.location?.coordinates?.coordinates && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Coordinates:</Text>
                    <Text style={styles.detailValue}>
                      {incident.location.coordinates.coordinates[1].toFixed(6)},{" "}
                      {incident.location.coordinates.coordinates[0].toFixed(6)}
                    </Text>
                  </View>
                )}

                {incident.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>
                      {incident.description}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.acceptButton,
                    isProcessing && styles.buttonDisabled,
                  ]}
                  onPress={handleAccept}
                  disabled={isProcessing}
                >
                  <View style={styles.buttonContent}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color="white"
                    />
                    <Text style={styles.buttonText}>
                      {isProcessing ? "Accepting..." : "Accept Assignment"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.declineButton,
                    isProcessing && styles.buttonDisabled,
                  ]}
                  onPress={handleDeclinePress}
                  disabled={isProcessing}
                >
                  <View style={styles.buttonContent}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color="white"
                    />
                    <Text style={styles.buttonText}>Decline</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* Decline Reason Picker */
            <View style={styles.declineContainer}>
              <Text style={styles.declineTitle}>Reason for Declining</Text>
              <Text style={styles.declineSubtitle}>
                Please select why you cannot accept this assignment
              </Text>

              <View style={styles.reasonButtonsContainer}>
                {DECLINE_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonButton,
                      declineReason === reason.value &&
                        styles.reasonButtonSelected,
                    ]}
                    onPress={() => setDeclineReason(reason.value)}
                  >
                    <Text
                      style={[
                        styles.reasonButtonText,
                        declineReason === reason.value &&
                          styles.reasonButtonTextSelected,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.declineButtonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancelDecline}
                  disabled={isProcessing}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmDeclineButton,
                    isProcessing && styles.buttonDisabled,
                  ]}
                  onPress={handleDeclineConfirm}
                  disabled={isProcessing}
                >
                  <Text style={styles.buttonText}>
                    {isProcessing ? "Submitting..." : "Confirm Decline"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  timerContainer: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  timerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  timerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  contentContainer: {
    maxHeight: "100%",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  severityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  detailsContainer: {
    padding: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 16,
    color: "#111827",
    lineHeight: 22,
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#10b981",
  },
  declineButton: {
    backgroundColor: "#6b7280",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  declineContainer: {
    padding: 20,
  },
  declineTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  declineSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  reasonButtonsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  reasonButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "white",
  },
  reasonButtonSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  reasonButtonText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  reasonButtonTextSelected: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  declineButtonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#6b7280",
  },
  confirmDeclineButton: {
    flex: 1,
    backgroundColor: "#ef4444",
  },
});
