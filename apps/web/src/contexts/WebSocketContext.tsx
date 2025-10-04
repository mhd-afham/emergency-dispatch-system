import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import io from "socket.io-client";

// Define Socket type for socket.io-client v4
type SocketType = ReturnType<typeof io>;

// Define Incident interface
interface Incident {
  _id: string;
  title: string;
  description: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  subcategory: string;
  status: "pending" | "in_progress" | "resolved" | "cancelled";
  assignedTo?: string[];
  reporterId: string;
  createdAt: string;
  updatedAt: string;
}

interface WebSocketMessage {
  type:
    | "incident_update"
    | "incident_created"
    | "incident_deleted"
    | "resource_update"
    | "assignment_update";
  data: any;
  timestamp: string;
}

interface WebSocketContextType {
  socket: SocketType | null;
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (eventName: string, data: any) => void;
  subscribe: (eventType: string, callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(
    new Map()
  );
  const isConnectingRef = useRef(false); // Track connection attempts

  // Connect to Socket.IO server
  const connect = useCallback(() => {
    if (!user || !token) {
      console.log("Socket.IO: No user or token available, skipping connection");
      return;
    }

    // Prevent multiple connections
    if (socket && socket.connected) {
      console.log("Socket.IO: Already connected, skipping new connection");
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log("Socket.IO: Connection already in progress, skipping");
      return;
    }

    // Clean up any existing socket
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    isConnectingRef.current = true;
    setIsConnecting(true);

    try {
      console.log("Socket.IO: Connecting to backend server...");

      // Connect to Socket.IO server (remove /api path for WebSocket connection)
      const apiUrl =
        process.env.REACT_APP_API_URL || "http://localhost:5000/api";
      const serverUrl = apiUrl.replace("/api", "");
      const newSocket = io(serverUrl, {
        auth: {
          token: token,
        },
        transports: ["polling", "websocket"], // Try polling first, then websocket
        timeout: 10000, // 10 second timeout
        reconnection: false, // Disable automatic reconnection, we'll handle it manually
      });

      newSocket.on("connect", () => {
        console.log("Socket.IO: Connected successfully");
        setIsConnected(true);
        setIsConnecting(false);
        setSocket(newSocket);
        isConnectingRef.current = false; // Reset connecting flag

        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      });

      newSocket.on("connected", (data: any) => {
        console.log("Socket.IO: Welcome message received", data);
      });

      // Handle incident events
      newSocket.on("incident_created", (incident: Incident) => {
        console.log("Socket.IO: New incident created", incident);
        const message: WebSocketMessage = {
          type: "incident_created",
          data: incident,
          timestamp: new Date().toISOString(),
        };
        setLastMessage(message);

        const subscribers = subscribersRef.current.get("incident_created");
        if (subscribers) {
          subscribers.forEach((callback) => {
            try {
              callback(incident);
            } catch (error) {
              console.error("Socket.IO: Error in subscriber callback", error);
            }
          });
        }
      });

      newSocket.on("incident_update", (incident: Incident) => {
        console.log("Socket.IO: Incident updated", incident);
        const message: WebSocketMessage = {
          type: "incident_update",
          data: incident,
          timestamp: new Date().toISOString(),
        };
        setLastMessage(message);

        const subscribers = subscribersRef.current.get("incident_update");
        if (subscribers) {
          subscribers.forEach((callback) => {
            try {
              callback(incident);
            } catch (error) {
              console.error("Socket.IO: Error in subscriber callback", error);
            }
          });
        }
      });

      newSocket.on("incident_deleted", (incidentId: string) => {
        console.log("Socket.IO: Incident deleted", incidentId);
        const message: WebSocketMessage = {
          type: "incident_deleted",
          data: incidentId,
          timestamp: new Date().toISOString(),
        };
        setLastMessage(message);

        const subscribers = subscribersRef.current.get("incident_deleted");
        if (subscribers) {
          subscribers.forEach((callback) => {
            try {
              callback(incidentId);
            } catch (error) {
              console.error("Socket.IO: Error in subscriber callback", error);
            }
          });
        }
      });

      // Handle assignment events
      newSocket.on("assignment_created", (data: any) => {
        console.log("Socket.IO: Assignment created", data);
        const subscribers = subscribersRef.current.get("assignment_created");
        if (subscribers) {
          subscribers.forEach((callback) => {
            try {
              callback(data);
            } catch (error) {
              console.error(
                "Socket.IO: Error in assignment_created subscriber",
                error
              );
            }
          });
        }
      });

      newSocket.on("assignment_status_update", (data: any) => {
        console.log("Socket.IO: Assignment status update", data);
        const subscribers = subscribersRef.current.get(
          "assignment_status_update"
        );
        if (subscribers) {
          subscribers.forEach((callback) => {
            try {
              callback(data);
            } catch (error) {
              console.error(
                "Socket.IO: Error in assignment_status_update subscriber",
                error
              );
            }
          });
        }
      });

      newSocket.on("assignment_declined", (data: any) => {
        console.log("Socket.IO: Assignment declined", data);
        const subscribers = subscribersRef.current.get("assignment_declined");
        if (subscribers) {
          subscribers.forEach((callback) => {
            try {
              callback(data);
            } catch (error) {
              console.error(
                "Socket.IO: Error in assignment_declined subscriber",
                error
              );
            }
          });
        }
      });

      newSocket.on("assignment_notification", (data: any) => {
        console.log("Socket.IO: Assignment notification", data);
        const subscribers = subscribersRef.current.get(
          "assignment_notification"
        );
        if (subscribers) {
          subscribers.forEach((callback) => {
            try {
              callback(data);
            } catch (error) {
              console.error(
                "Socket.IO: Error in assignment_notification subscriber",
                error
              );
            }
          });
        }
      });

      newSocket.on("connect_error", (error: Error) => {
        console.error("Socket.IO: Connection error", error);
        setIsConnected(false);
        setIsConnecting(false);
        isConnectingRef.current = false; // Reset connecting flag on error
      });

      newSocket.on("disconnect", (reason: string) => {
        console.log("Socket.IO: Disconnected", reason);
        setIsConnected(false);
        setIsConnecting(false);
        setSocket(null);
        isConnectingRef.current = false; // Reset connecting flag on disconnect

        // Only reconnect for specific reasons, avoid aggressive reconnection
        if (reason === "io server disconnect" || reason === "transport close") {
          console.log(
            "Socket.IO: Server initiated disconnect, will attempt to reconnect in 5 seconds..."
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        } else {
          console.log(
            "Socket.IO: Connection closed, not attempting to reconnect"
          );
        }
      });
    } catch (error) {
      console.error("Socket.IO: Error creating connection", error);
      setIsConnecting(false);
      isConnectingRef.current = false; // Reset connecting flag on error
    }
  }, [user, token, socket]);

  // Disconnect Socket.IO client
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setSocket(null);
    setIsConnected(false);
    setIsConnecting(false);
    console.log("Socket.IO: Disconnected");
  }, [socket]);

  // Send message through Socket.IO
  const sendMessage = useCallback(
    (eventName: string, data: any) => {
      if (socket && isConnected) {
        try {
          socket.emit(eventName, data);
        } catch (error) {
          console.error("Socket.IO: Error sending message", error);
        }
      } else {
        console.warn("Socket.IO: Cannot send message - not connected");
      }
    },
    [socket, isConnected]
  );

  // Subscribe to specific event types
  const subscribe = useCallback(
    (eventType: string, callback: (data: any) => void) => {
      if (!subscribersRef.current.has(eventType)) {
        subscribersRef.current.set(eventType, new Set());
      }

      subscribersRef.current.get(eventType)!.add(callback);

      // Return unsubscribe function
      return () => {
        const subscribers = subscribersRef.current.get(eventType);
        if (subscribers) {
          subscribers.delete(callback);
          if (subscribers.size === 0) {
            subscribersRef.current.delete(eventType);
          }
        }
      };
    },
    []
  );

  // Connect when user logs in - simple approach to avoid loops
  useEffect(() => {
    if (user && token) {
      // Only connect if not already connected
      if (!socket || !socket.connected) {
        connect();
      }
    } else {
      // Disconnect if no user/token
      disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]); // Intentionally limited dependencies to prevent loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Cleanup only on unmount

  const value: WebSocketContextType = {
    socket,
    isConnected,
    isConnecting,
    lastMessage,
    sendMessage,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
