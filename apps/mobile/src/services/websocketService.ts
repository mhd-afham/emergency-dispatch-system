import { io, Socket } from "socket.io-client";
import { WEBSOCKET_URL } from "../constants";

class WebSocketService {
  private socket: Socket | null = null;
  private crewId: string | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  /**
   * Connect to WebSocket server with authentication
   */
  public connect(token: string, crewId: string): void {
    if (this.socket && this.isConnected) {
      console.log("[WebSocket] Already connected");
      return;
    }

    this.crewId = crewId;

    console.log(`[WebSocket] Connecting to ${WEBSOCKET_URL}...`);

    this.socket = io(WEBSOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
    this.joinCrewRoom(crewId);
  }

  /**
   * Setup event listeners for connection events
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("[WebSocket] Connected successfully");
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Rejoin crew room after reconnection
      if (this.crewId) {
        this.joinCrewRoom(this.crewId);
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`[WebSocket] Disconnected: ${reason}`);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("[WebSocket] Connection error:", error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("[WebSocket] Max reconnection attempts reached");
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 [WebSocket] Reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("[WebSocket] Reconnection error:", error.message);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("[WebSocket] Reconnection failed");
    });
  }

  /**
   * Join crew-specific room for targeted notifications
   */
  private joinCrewRoom(crewId: string): void {
    if (!this.socket) return;

    const roomName = `crew-${crewId}`;
    this.socket.emit("join_crew_room", roomName);
    console.log(`[WebSocket] Joined room: ${roomName}`);
  }

  /**
   * Listen for assignment notifications
   */
  public onAssignmentNotification(callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn("⚠️ [WebSocket] Socket not connected");
      return;
    }

    this.socket.on("assignment_notification", (data) => {
      console.log("🚨 [WebSocket] Assignment notification received:", data);
      callback(data);
    });
  }

  /**
   * Listen for assignment status updates
   */
  public onAssignmentStatusUpdate(callback: (data: any) => void): void {
    if (!this.socket) return;

    this.socket.on("assignment_status_update", (data) => {
      console.log("🔄 [WebSocket] Assignment status update:", data);
      callback(data);
    });
  }

  /**
   * Listen for assignment cancellation
   */
  public onAssignmentCancelled(callback: (data: any) => void): void {
    if (!this.socket) return;

    this.socket.on("assignment:cancelled", (data) => {
      console.log("🚫 [WebSocket] Assignment cancelled:", data);
      callback(data);
    });
  }

  /**
   * Listen for vehicle readiness updates (October 21, 2025)
   */
  public onVehicleReadinessUpdate(callback: (data: any) => void): void {
    if (!this.socket) return;

    this.socket.on("vehicle_readiness_update", (data) => {
      console.log("🚗 [WebSocket] Vehicle readiness update:", data);
      callback(data);
    });
  }

  /**
   * Listen for vehicle status updates (October 21, 2025)
   */
  public onVehicleStatusUpdate(callback: (data: any) => void): void {
    if (!this.socket) return;

    this.socket.on("vehicle_status_update", (data) => {
      console.log("🚛 [WebSocket] Vehicle status update:", data);
      callback(data);
    });
  }

  /**
   * Listen for messages from dispatcher
   */
  public onMessageReceived(callback: (data: any) => void): void {
    if (!this.socket) return;

    this.socket.on("message_received", (data) => {
      console.log("💬 [WebSocket] Message received:", data);
      callback(data);
    });
  }

  /**
   * Remove specific event listener
   */
  public off(eventName: string): void {
    if (!this.socket) return;
    this.socket.off(eventName);
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      console.log("[WebSocket] Disconnecting...");
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.crewId = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get socket instance (for advanced usage)
   */
  public getSocket(): Socket | null {
    return this.socket;
  }
}

// Create and export a singleton instance
export const websocketService = new WebSocketService();
export default WebSocketService;
