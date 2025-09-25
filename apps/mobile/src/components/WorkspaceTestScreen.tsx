// Test component to verify workspace imports
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { API_ENDPOINTS, USER_ROLES } from "@emergency-dispatch/shared";
import { apiClient } from "@emergency-dispatch/api-client";

export const WorkspaceTestScreen: React.FC = () => {
  // Test that we can import from shared packages
  const endpoints = API_ENDPOINTS;
  const roles = USER_ROLES;

  React.useEffect(() => {
    // Test that API client is available
    console.log("API Client available:", typeof apiClient);
    console.log("API Endpoints:", endpoints);
    console.log("User Roles:", roles);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workspace Integration Test</Text>
      <Text style={styles.text}>✅ @emergency-dispatch/shared imported</Text>
      <Text style={styles.text}>
        ✅ @emergency-dispatch/api-client imported
      </Text>
      <Text style={styles.text}>
        Check console for detailed import verification
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
});
