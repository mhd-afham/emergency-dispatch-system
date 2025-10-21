import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import LoginScreen from "./src/components/LoginScreen";
import DashboardScreen from "./src/components/DashboardScreen";
import { apiClient } from "./src/services/apiClient";
import { websocketService } from "./src/services/websocketService";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [crew, setCrew] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();

    // Cleanup WebSocket on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const userData = await SecureStore.getItemAsync("userData");
      const crewData = await SecureStore.getItemAsync("crewData");

      if (token && userData && crewData) {
        const parsedUser = JSON.parse(userData);
        const parsedCrew = JSON.parse(crewData);

        // Set token in API client
        apiClient.setAuthToken(token);

        // Connect WebSocket
        websocketService.connect(token, parsedCrew._id);

        setUser(parsedUser);
        setCrew(parsedCrew);
        setIsLoggedIn(true);

        console.log(
          "✅ Auto-login successful for crew leader:",
          parsedCrew.personal.firstName
        );
      }
    } catch (error) {
      console.log("❌ Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (token: string, userData: any, crewData: any) => {
    try {
      // Store auth data securely
      await SecureStore.setItemAsync("authToken", token);
      await SecureStore.setItemAsync("userData", JSON.stringify(userData));
      await SecureStore.setItemAsync("crewData", JSON.stringify(crewData));

      // Set token in API client
      apiClient.setAuthToken(token);

      // Connect WebSocket
      websocketService.connect(token, crewData._id);

      setUser(userData);
      setCrew(crewData);
      setIsLoggedIn(true);

      console.log(
        "✅ Login successful for crew leader:",
        crewData.personal.firstName
      );
    } catch (error) {
      console.log("❌ Save auth data failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      // Disconnect WebSocket
      websocketService.disconnect();

      // Clear secure storage
      await SecureStore.deleteItemAsync("authToken");
      await SecureStore.deleteItemAsync("userData");
      await SecureStore.deleteItemAsync("crewData");

      // Clear API client token
      apiClient.clearAuthToken();
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.log("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isLoggedIn && user && crew) {
    return <DashboardScreen user={user} crew={crew} onLogout={handleLogout} />;
  }

  return <LoginScreen onLogin={handleLogin} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
