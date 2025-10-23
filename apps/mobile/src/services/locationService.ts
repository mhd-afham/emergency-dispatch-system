import * as Location from "expo-location";
import { apiClient } from "./apiClient";
import { GPS_UPDATE_INTERVAL } from "../constants";

class LocationService {
  private isTracking: boolean = false;
  private locationSubscription: Location.LocationSubscription | null = null;
  private crewId: string | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Request location permissions
   * Note: Background permissions only work in standalone builds, not Expo Go
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      // Step 1: Request foreground permissions (required)
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        console.error("❌ Foreground location permission denied");
        return false;
      }

      console.log("✅ Foreground location permission granted");

      // Step 2: Try to request background permissions (optional, may fail in Expo Go)
      try {
        const { status: backgroundStatus } =
          await Location.requestBackgroundPermissionsAsync();

        if (backgroundStatus !== "granted") {
          console.warn(
            "⚠️ Background location permission denied (optional for continuous tracking)"
          );
        } else {
          console.log("✅ Background location permission granted");
        }
      } catch (backgroundError: any) {
        // This is expected in Expo Go - Info.plist keys not available
        if (backgroundError.message?.includes("NSLocation")) {
          console.warn(
            "⚠️ Background location permissions not available (running in Expo Go). This is expected and doesn't affect foreground tracking."
          );
        } else {
          console.warn(
            "⚠️ Background permission request failed:",
            backgroundError.message
          );
        }
        // Don't fail the entire permission request, foreground is enough for now
      }

      return true; // Foreground permission is sufficient
    } catch (error) {
      console.error("❌ Error requesting location permissions:", error);
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   */
  public async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("❌ Error checking location permissions:", error);
      return false;
    }
  }

  /**
   * Get current location once
   */
  public async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        console.error("❌ No location permissions");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log("📍 Current location:", {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });

      return location;
    } catch (error) {
      console.error("❌ Error getting current location:", error);
      return null;
    }
  }

  /**
   * Start continuous location tracking with interval updates to backend
   */
  public async startTracking(crewId: string): Promise<boolean> {
    if (this.isTracking) {
      console.warn("⚠️ Location tracking already active");
      return true;
    }

    const hasPermission = await this.hasPermissions();
    if (!hasPermission) {
      console.error("❌ Cannot start tracking: No location permissions");
      return false;
    }

    this.crewId = crewId;
    this.isTracking = true;

    try {
      console.log(`🎯 Starting location tracking for crew: ${crewId}`);

      // Start watching location with high accuracy
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: GPS_UPDATE_INTERVAL, // 15 seconds
          distanceInterval: 50, // Update if moved 50+ meters
        },
        this.handleLocationUpdate.bind(this)
      );

      console.log("✅ Location tracking started");
      return true;
    } catch (error) {
      console.error("❌ Error starting location tracking:", error);
      this.isTracking = false;
      return false;
    }
  }

  /**
   * Handle location updates
   */
  private async handleLocationUpdate(location: Location.LocationObject) {
    if (!this.crewId) {
      console.error("❌ No crew ID set for location updates");
      return;
    }

    try {
      const { latitude, longitude, accuracy, altitude, heading, speed } =
        location.coords;

      console.log("📍 Location update:", {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy,
        speed: speed,
      });

      // Send location to backend (GeoJSON format: [longitude, latitude])
      await apiClient.updateCrewLocation(this.crewId, [longitude, latitude]);

      console.log("✅ Location sent to backend");
    } catch (error) {
      console.error("❌ Error sending location update:", error);
      // Don't stop tracking on error, just log it
    }
  }

  /**
   * Stop location tracking
   */
  public stopTracking(): void {
    if (!this.isTracking) {
      console.warn("⚠️ Location tracking not active");
      return;
    }

    console.log("🛑 Stopping location tracking");

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isTracking = false;
    this.crewId = null;

    console.log("✅ Location tracking stopped");
  }

  /**
   * Check if currently tracking
   */
  public isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Get tracking status
   */
  public getTrackingStatus(): {
    isTracking: boolean;
    crewId: string | null;
  } {
    return {
      isTracking: this.isTracking,
      crewId: this.crewId,
    };
  }
}

// Export singleton instance
export const locationService = new LocationService();
