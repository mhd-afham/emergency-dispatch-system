import axios from "axios";

// Create axios instance with base configuration matching auth service
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: This enables cookies for JWT
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Shift types
export interface Shift {
  _id: string;
  shift: {
    name: string;
    type: "regular" | "overtime" | "emergency";
  };
  schedule: {
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    recurrence: "none" | "daily" | "weekly" | "custom";
  };
  staffing: {
    requiredCrewCount: number;
    requiredRoles: string[];
    minimumCertificationLevel: "Basic" | "Intermediate" | "Advanced" | "Expert";
    assignedCrew: CrewAssignment[];
  };
  status: {
    current: "planned" | "active" | "completed" | "cancelled";
  };
  stationId: {
    _id: string;
    name: string;
  };
  supervision: {
    supervisorId: {
      firstName: string;
      lastName: string;
    };
  };
  staffingPercentage?: number;
}

export interface CrewAssignment {
  _id: string;
  crewId: {
    _id: string;
    personal: {
      firstName: string;
      lastName: string;
      employeeId: string;
    };
    professional: {
      role: string;
      certificationLevel: string;
    };
  };
  role: string;
  status: "assigned" | "confirmed" | "completed" | "absent" | "cancelled";
  assignedAt: string;
}

export interface CrewMember {
  _id: string;
  personal: {
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
  };
  professional: {
    role: "EMT" | "Paramedic" | "Firefighter" | "Driver" | "Supervisor";
    certificationLevel: "Basic" | "Intermediate" | "Advanced" | "Expert";
  };
  currentStatus: {
    availability:
      | "available"
      | "on_duty"
      | "off_duty"
      | "on_leave"
      | "training";
  };
}

export interface CreateShiftForm {
  name: string;
  type: "regular" | "overtime" | "emergency";
  date: string;
  startTime: string;
  endTime: string;
  requiredCrewCount: number;
  requiredRoles: string[];
  minimumCertificationLevel: "Basic" | "Intermediate" | "Advanced" | "Expert";
  stationId: string;
  supervisorNotes?: string;
  recurrence: "none" | "daily" | "weekly" | "custom";
}

// Update format that matches backend's nested structure
export interface UpdateShiftData {
  shift?: {
    name?: string;
    type?: "regular" | "overtime" | "emergency";
  };
  schedule?: {
    startTime?: string;
    endTime?: string;
    recurrence?: "none" | "daily" | "weekly" | "custom";
  };
  staffing?: {
    requiredCrewCount?: number;
    requiredRoles?: string[];
    minimumCertificationLevel?:
      | "Basic"
      | "Intermediate"
      | "Advanced"
      | "Expert";
  };
  supervision?: {
    supervisorNotes?: string;
  };
  status?: {
    current?: "planned" | "active" | "completed" | "cancelled";
  };
}

export interface ShiftsResponse {
  success: boolean;
  data: Shift[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ShiftResponse {
  success: boolean;
  data: Shift;
}

export interface AvailableCrewResponse {
  success: boolean;
  data: {
    availableCrew: CrewMember[];
    crewByRole: { [key: string]: CrewMember[] };
    shiftInfo: {
      id: string;
      name: string;
      date: string;
      startTime: string;
      endTime: string;
      requiredCrewCount: number;
      requiredRoles: string[];
      currentlyAssigned: number;
    };
  };
}

// Shift API methods
export const shiftService = {
  // Get all shifts
  getShifts: async (params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    stationId?: string;
    page?: number;
    limit?: number;
  }): Promise<ShiftsResponse> => {
    const response = await api.get("/api/shifts", { params });
    return response.data;
  },

  // Get shift by ID
  getShift: async (id: string): Promise<ShiftResponse> => {
    const response = await api.get(`/api/shifts/${id}`);
    return response.data;
  },

  // Create new shift
  createShift: async (shiftData: CreateShiftForm): Promise<ShiftResponse> => {
    const response = await api.post("/api/shifts", shiftData);
    return response.data;
  },

  // Update shift
  updateShift: async (
    id: string,
    updates: UpdateShiftData | Partial<CreateShiftForm>
  ): Promise<ShiftResponse> => {
    const response = await api.put(`/api/shifts/${id}`, updates);
    return response.data;
  },

  // Delete shift
  deleteShift: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/shifts/${id}`);
    return response.data;
  },

  // Get available crew for shift
  getAvailableCrew: async (shiftId: string): Promise<AvailableCrewResponse> => {
    const response = await api.get(`/api/shifts/available-crew/${shiftId}`);
    return response.data;
  },

  // Assign crew to shift
  assignCrew: async (
    shiftId: string,
    crewAssignments: { crewId: string; role: string }[]
  ): Promise<ShiftResponse> => {
    const response = await api.post(`/api/shifts/${shiftId}/assign-crew`, {
      crewAssignments,
    });
    return response.data;
  },

  // Remove crew from shift
  removeCrew: async (
    shiftId: string,
    crewId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(
      `/api/shifts/${shiftId}/remove-crew/${crewId}`
    );
    return response.data;
  },

  // Get calendar view
  getCalendarShifts: async (
    year: number,
    month: number,
    stationId?: string
  ) => {
    const response = await api.get(`/api/shifts/calendar/${year}/${month}`, {
      params: { stationId },
    });
    return response.data;
  },
};

// Crew API methods
export const crewService = {
  // Get all crew
  getCrew: async (params?: {
    role?: string;
    certificationLevel?: string;
    availability?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get("/api/crew", { params });
    return response.data;
  },

  // Get available crew
  getAvailableCrew: async (params?: {
    date?: string;
    startTime?: string;
    endTime?: string;
    role?: string;
    certificationLevel?: string;
  }) => {
    const response = await api.get("/api/crew/available", { params });
    return response.data;
  },

  // Get crew by ID
  getCrewById: async (id: string) => {
    const response = await api.get(`/api/crew/${id}`);
    return response.data;
  },

  // Update crew availability
  updateAvailability: async (id: string, availability: string) => {
    const response = await api.put(`/api/crew/${id}/availability`, {
      availability,
    });
    return response.data;
  },

  // Get crew statistics
  getStatistics: async () => {
    const response = await api.get("/api/crew/statistics/overview");
    return response.data;
  },
};

export default { shiftService, crewService };
