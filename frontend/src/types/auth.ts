// User types matching backend User model
export interface User {
  _id: string;
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  auth: {
    role:
      | "Call Taker"
      | "Dispatcher"
      | "Field Crew"
      | "Supervisor"
      | "Admin"
      | "Citizen";
    employeeId?: string;
    lastLogin?: Date;
    loginAttempts: number;
    isLocked: boolean;
    lockUntil?: Date;
  };
  settings: {
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
    preferences: {
      theme: "light" | "dark";
      notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Authenticated user type (what backend returns in login response)
export interface AuthenticatedUser {
  id: string;
  email: string;
  role:
    | "Call Taker"
    | "Dispatcher"
    | "Field Crew"
    | "Supervisor"
    | "Admin"
    | "Citizen";
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin?: string;
  employeeId?: string;
}

// Authentication related types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  auth: {
    password: string;
    role: User["auth"]["role"];
    employeeId?: string;
  };
}

export interface AuthResponse {
  token: string;
  user: AuthenticatedUser;
  message: string;
}

export interface AuthContextType {
  user: AuthenticatedUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<AuthenticatedUser>) => Promise<void>;
}

// API Error type
export interface ApiError {
  message: string;
  errors?: Record<string, string>;
  status?: number;
}
