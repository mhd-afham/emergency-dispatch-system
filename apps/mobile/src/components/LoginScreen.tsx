import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { apiClient } from "../services/apiClient";
import { USER_ROLES } from "../constants";

interface LoginScreenProps {
  onLogin: (token: string, user: any, crew: any) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    setStatusMessage("Authenticating...");

    try {
      // Step 1: Authenticate with User model
      const authResponse = await apiClient.login(email, password);

      if (!authResponse.data.success) {
        Alert.alert(
          "Login Failed",
          authResponse.data.message || "Invalid credentials"
        );
        setLoading(false);
        setStatusMessage("");
        return;
      }

      const { token, user } = authResponse.data;

      // Step 2: Validate role is Field Crew
      if (user.auth?.role !== USER_ROLES.FIELD_CREW) {
        Alert.alert(
          "Access Denied",
          `Mobile app is for Field Crew only. Your role: ${
            user.auth?.role || "Unknown"
          }`
        );
        setLoading(false);
        setStatusMessage("");
        return;
      }

      // Set token for subsequent requests
      apiClient.setAuthToken(token);

      setStatusMessage("Fetching crew profile...");

      // Step 3: Fetch Crew profile by employeeId
      const crewResponse = await apiClient.getCrewByEmployeeId(
        user.auth.employeeId
      );

      if (!crewResponse.data.success) {
        Alert.alert(
          "Profile Error",
          crewResponse.data.message || "Could not fetch crew profile"
        );
        setLoading(false);
        setStatusMessage("");
        return;
      }

      const crew = crewResponse.data.data;

      // Step 4: Validate isLeader = true
      if (!crewResponse.data.isLeader || !crew.professional?.isLeader) {
        Alert.alert(
          "Access Denied",
          "Mobile app access is restricted to crew leaders only. Please contact your supervisor.",
          [{ text: "OK" }]
        );
        apiClient.clearAuthToken();
        setLoading(false);
        setStatusMessage("");
        return;
      }

      setStatusMessage("Login successful!");

      // Step 5: Pass token, user, and crew data to parent
      setTimeout(() => {
        onLogin(token, user, crew);
      }, 500);
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Error",
        error.response?.data?.message || error.message || "Login failed"
      );
      apiClient.clearAuthToken();
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.title}>ResponDr</Text>
        <Text style={styles.subtitle}>Emergency Dispatch System</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                {statusMessage || "Logging in..."}
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Mobile access for crew leaders only
        </Text>
        <Text style={[styles.footerText, { fontSize: 11, marginTop: 4 }]}>
          Emergency Dispatch System
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  form: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#f9fafb",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
