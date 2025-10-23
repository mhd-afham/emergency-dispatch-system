import axios, { AxiosInstance, AxiosResponse } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";

class ApiClient {
  private instance: AxiosInstance;
  private authToken: string = "";

  constructor(baseURL: string = API_BASE_URL) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token and log requests
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Enhanced request logging for debugging
        console.log("[API REQUEST]:", {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`,
          data: config.data,
          hasToken: !!token,
        });

        return config;
      },
      (error) => {
        console.error("[API REQUEST ERROR]:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and logging
    this.instance.interceptors.response.use(
      (response) => {
        // Enhanced response logging for debugging
        console.log("[API SUCCESS]:", {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      (error) => {
        // Enhanced error logging for debugging
        console.error("[API ERROR]:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data,
          code: error.code,
        });

        if (error.response?.status === 401) {
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // Return the stored token, preference for explicit token over AsyncStorage
    return this.authToken || null;
  }

  public setAuthToken(token: string): void {
    this.authToken = token;
    AsyncStorage.setItem("token", token);
  }

  public clearAuthToken(): void {
    this.authToken = "";
    AsyncStorage.removeItem("token");
  }

  private async handleAuthError(): Promise<void> {
    await this.clearAuthToken();
    // Navigate to login screen or handle auth error
    console.log("Authentication error - redirecting to login");
  }

  // Auth endpoints
  public async login(email: string, password: string): Promise<AxiosResponse> {
    // Backend expects "login" field (not "email")
    return this.instance.post("/auth/login", { login: email, password });
  }

  public async register(userData: any): Promise<AxiosResponse> {
    return this.instance.post("/auth/register", userData);
  }

  public async logout(): Promise<void> {
    await this.clearAuthToken();
  }

  // Generic API methods
  public async get(url: string): Promise<AxiosResponse> {
    return this.instance.get(url);
  }

  public async post(url: string, data: any): Promise<AxiosResponse> {
    return this.instance.post(url, data);
  }

  public async put(url: string, data: any): Promise<AxiosResponse> {
    return this.instance.put(url, data);
  }

  public async delete(url: string): Promise<AxiosResponse> {
    return this.instance.delete(url);
  }

  // Incident endpoints
  public async getIncidents(): Promise<AxiosResponse> {
    return this.get("/incidents");
  }

  public async createIncident(incidentData: any): Promise<AxiosResponse> {
    return this.post("/incidents", incidentData);
  }

  public async updateIncident(
    id: string,
    incidentData: any
  ): Promise<AxiosResponse> {
    return this.put(`/incidents/${id}`, incidentData);
  }

  public async deleteIncident(id: string): Promise<AxiosResponse> {
    return this.delete(`/incidents/${id}`);
  }

  // Crew endpoints (Sprint 1)
  public async getCrewByEmployeeId(employeeId: string): Promise<AxiosResponse> {
    return this.get(`/crews/by-employee/${employeeId}`);
  }

  public async getCrewAssignments(crewId: string): Promise<AxiosResponse> {
    return this.get(`/crews/${crewId}/assignments`);
  }

  public async getCrewAssignmentHistory(
    crewId: string,
    limit: number = 10
  ): Promise<AxiosResponse> {
    return this.get(`/crews/${crewId}/assignments/history?limit=${limit}`);
  }

  public async getCrewVehicle(crewId: string): Promise<AxiosResponse> {
    return this.get(`/crews/${crewId}/vehicle`);
  }

  public async updateCrewLocation(
    crewId: string,
    coordinates: [number, number]
  ): Promise<AxiosResponse> {
    return this.put(`/crews/${crewId}/location`, { coordinates });
  }

  // Assignment endpoints (Sprint 1)
  public async updateAssignmentStatus(
    assignmentId: string,
    status: string,
    declineReason?: string,
    notes?: string
  ): Promise<AxiosResponse> {
    return this.put(`/assignments/${assignmentId}/status`, {
      status,
      declineReason,
      notes,
    });
  }

  // Vehicle endpoints (October 20, 2025)
  public async updateVehicleReadiness(
    vehicleId: string,
    data: { isReady: boolean; notReadyReason?: string | null }
  ): Promise<AxiosResponse> {
    return this.put(`/vehicles/${vehicleId}/readiness`, data);
  }

  public async updateVehicleStatus(
    vehicleId: string,
    data: { currentStatus: string }
  ): Promise<AxiosResponse> {
    return this.put(`/vehicles/${vehicleId}/status`, data);
  }
}

// Create and export a default instance
export const apiClient = new ApiClient();
export default ApiClient;
