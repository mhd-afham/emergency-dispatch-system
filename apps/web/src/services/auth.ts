import axios from "axios";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  AuthenticatedUser,
  ApiError,
} from "../types/auth";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",     
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: This enables cookies for JWT
});// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect on token expiration, not during login attempts
      const isLoginRequest = error.config?.url?.includes("/auth/login");
      if (!isLoginRequest) {
        // Token expired or invalid for authenticated requests
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // Transform email to login for backend compatibility
      const loginData = {
        login: credentials.email,
        password: credentials.password,
      };

      const response = await api.post<AuthResponse>("/api/auth/login", loginData);
      const { token, user } = response.data;

      // Store token and user in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      return response.data;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || "Login failed",
        errors: error.response?.data?.errors,
        status: error.response?.status,
      };
      throw apiError;
    }
  },

  // Register user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>("/api/auth/register", data);
      const { token, user } = response.data;

      // Store token and user in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      return response.data;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || "Registration failed",
        errors: error.response?.data?.errors,
        status: error.response?.status,
      };
      throw apiError;
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get<{ user: User }>("/api/auth/profile");
      return response.data.user;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || "Failed to fetch profile",
        status: error.response?.status,
      };
      throw apiError;
    }
  },

  // Update user profile
  updateProfile: async (
    data: Partial<AuthenticatedUser>
  ): Promise<AuthenticatedUser> => {
    try {
      const response = await api.put<{ user: AuthenticatedUser }>(
        "/api/auth/profile",
        data
      );

      // Update user in localStorage
      localStorage.setItem("user", JSON.stringify(response.data.user));

      return response.data.user;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || "Failed to update profile",
        errors: error.response?.data?.errors,
        status: error.response?.status,
      };
      throw apiError;
    }
  },

  // Verify token (useful for protected routes)
  verifyToken: async (): Promise<boolean> => {
    try {
      await api.get("/api/auth/me");
      return true;
    } catch (error) {
      return false;
    }
  },

  // Change password
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    try {
      await api.put("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || "Failed to change password",
        errors: error.response?.data?.errors,
        status: error.response?.status,
      };
      throw apiError;
    }
  },
};

export default api;
