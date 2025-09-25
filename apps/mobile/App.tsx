import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/components/LoginScreen";
import DashboardScreen from "./src/components/DashboardScreen";
import { apiClient } from "@emergency-dispatch/api-client";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userData = await AsyncStorage.getItem("userData");

      if (token && userData) {
        // Set the token in the API client
        apiClient.setAuthToken(token);
        setUser(JSON.parse(userData));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.log("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (token: string, userData: any) => {
    try {
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      apiClient.setAuthToken(token);
      setUser(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.log("Save auth data failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");
      apiClient.setAuthToken("");
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.log("Logout failed:", error);
    }
  };

  if (loading) {
    return null; // You could show a loading screen here
  }

  if (isLoggedIn && user) {
    return <DashboardScreen user={user} onLogout={handleLogout} />;
  }

  return <LoginScreen onLogin={handleLogin} />;
}
