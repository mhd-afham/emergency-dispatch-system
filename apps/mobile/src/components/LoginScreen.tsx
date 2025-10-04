import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { apiClient } from "../services/apiClient";
import { USER_ROLES } from "../constants";
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from "../styles/theme";

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
      if (user.role !== USER_ROLES.FIELD_CREW) {
        Alert.alert(
          "Access Denied",
          `Mobile app is for Field Crew only. Your role: ${
            user.role || "unknown"
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
      const crewResponse = await apiClient.getCrewByEmployeeId(user.employeeId);

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
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/respondr-horizontal.svg")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.subtitle}>Emergency Dispatch System</Text>
        <View style={styles.badgeContainer}>
          <MaterialIcons
            name="verified-user"
            size={16}
            color={colors.primary}
          />
          <Text style={styles.badge}>Crew Leader Access</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <MaterialIcons
            name="email"
            size={20}
            color={colors.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email or Username"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons
            name="lock"
            size={20}
            color={colors.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.textOnPrimary} size="small" />
              <Text style={[styles.buttonText, { marginLeft: spacing.sm }]}>
                {statusMessage || "Logging in..."}
              </Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Sign In</Text>
              <MaterialIcons
                name="arrow-forward"
                size={20}
                color={colors.textOnPrimary}
                style={{ marginLeft: spacing.sm }}
              />
            </View>
          )}
        </TouchableOpacity>

        {statusMessage && !loading && (
          <View style={styles.statusContainer}>
            <MaterialIcons
              name="check-circle"
              size={16}
              color={colors.success}
            />
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <MaterialIcons
          name="info-outline"
          size={14}
          color={colors.textSecondary}
        />
        <Text style={styles.footerText}>
          This application is for authorized crew leaders only
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  logo: {
    width: 220,
    height: 60,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
    fontWeight: typography.fontWeight.medium,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  badge: {
    fontSize: typography.fontSize.xs,
    color: colors.primary700,
    fontWeight: typography.fontWeight.semibold,
  },
  form: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.lg,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.success + "15",
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.lineHeight.normal * typography.fontSize.xs,
  },
});
