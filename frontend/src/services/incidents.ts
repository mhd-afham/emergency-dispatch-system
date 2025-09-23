import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Incident Types
export interface Caller {
  name?: string;
  phone: string;
  email?: string;
  isCallback?: boolean;
}

export interface Classification {
  type: 'Medical' | 'Fire' | 'Rescue' | 'Police' | 'Other';
  subType?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  priority?: number;
}

export interface Address {
  street?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  fullAddress: string;
}

export interface Location {
  address: Address;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  accuracy?: number;
  isVerified?: boolean;
  verificationMethod?: 'GPS' | 'Address' | 'Manual' | 'Landmark';
}

export interface IncidentDetails {
  description: string;
  additionalInfo?: string;
  hazards?: string[];
  accessNotes?: string;
  landmarksNearby?: string[];
}

export interface CreateIncidentData {
  caller: Caller;
  classification: Classification;
  location: Location;
  details: IncidentDetails;
  source?: 'Web' | 'Mobile' | 'SMS' | 'Phone' | 'API';
}

export interface DuplicateWarning {
  incidentId: string;
  score: number;
  distance: number;
  timeDiff: number;
  type: string;
  severity: string;
}

export interface Incident {
  _id: string;
  incidentId: string;
  caller: Caller;
  classification: Classification;
  location: Location;
  details: IncidentDetails;
  status: {
    current: 'Logged' | 'Dispatched' | 'En Route' | 'On Scene' | 'Completed' | 'Cancelled';
    history: Array<{
      status: string;
      timestamp: string;
      updatedBy?: any;
      notes?: string;
    }>;
  };
  duplicateInfo: {
    isDuplicate: boolean;
    originalIncident?: string;
    relatedIncidents?: string[];
    duplicateScore?: number;
  };
  audit: {
    createdBy: any;
    createdAt: string;
    updatedBy?: any;
    updatedAt: string;
    source: string;
  };
  metrics?: {
    callDuration?: number;
    responseTime?: number;
    resolutionTime?: number;
  };
}

export interface IncidentFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IncidentsResponse {
  success: boolean;
  count: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalIncidents: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  data: Incident[];
}

export interface CreateIncidentResponse {
  success: boolean;
  message: string;
  data: {
    incident: Incident;
    duplicateWarnings: DuplicateWarning[];
  };
}

export interface IncidentStats {
  summary: {
    totalIncidents: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    byType: string[];
    bySeverity: string[];
    byStatus: string[];
  };
  activeIncidents: number;
  hourlyDistribution: Array<{
    _id: { hour: number };
    count: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

// API Functions

/**
 * Create a new emergency incident
 */
export const createIncident = async (incidentData: CreateIncidentData): Promise<CreateIncidentResponse> => {
  try {
    const response = await api.post('/incidents', incidentData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create incident');
  }
};

/**
 * Get incidents with filtering and pagination
 */
export const getIncidents = async (filters?: IncidentFilters): Promise<IncidentsResponse> => {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get(`/incidents?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch incidents');
  }
};

/**
 * Get incident by ID
 */
export const getIncidentById = async (id: string): Promise<{ success: boolean; data: Incident }> => {
  try {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch incident');
  }
};

/**
 * Update an existing incident
 */
export const updateIncident = async (id: string, updateData: Partial<CreateIncidentData>): Promise<{ success: boolean; data: Incident }> => {
  try {
    const response = await api.put(`/incidents/${id}`, updateData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update incident');
  }
};

/**
 * Check for potential duplicate incidents
 */
export const checkDuplicates = async (coordinates: [number, number], timeWindowMinutes?: number, radiusMeters?: number) => {
  try {
    const response = await api.post('/incidents/check-duplicates', {
      coordinates,
      timeWindowMinutes: timeWindowMinutes || 30,
      radiusMeters: radiusMeters || 1000,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to check duplicates');
  }
};

/**
 * Merge duplicate incidents
 */
export const mergeIncidents = async (duplicateId: string, originalId: string) => {
  try {
    const response = await api.post(`/incidents/${duplicateId}/merge`, {
      originalIncidentId: originalId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to merge incidents');
  }
};

/**
 * Get incident statistics
 */
export const getIncidentStats = async (startDate?: string, endDate?: string): Promise<{ success: boolean; data: IncidentStats }> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/incidents/stats?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
  }
};

/**
 * Mock geocoding function - in production this would use Google Maps API
 */
export const geocodeAddress = async (address: string): Promise<[number, number]> => {
  // Mock implementation - return Colombo coordinates as default
  return new Promise((resolve) => {
    setTimeout(() => {
      const addressLower = address.toLowerCase();
      
      if (addressLower.includes('kandy')) {
        resolve([80.6337, 7.2906]);
      } else if (addressLower.includes('galle')) {
        resolve([80.2170, 6.0535]);
      } else if (addressLower.includes('negombo')) {
        resolve([79.8358, 7.2083]);
      } else if (addressLower.includes('jaffna')) {
        resolve([80.0074, 9.6615]);
      } else {
        resolve([79.8612, 6.9271]); // Colombo default
      }
    }, 500); // Simulate API delay
  });
};

export default {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  checkDuplicates,
  mergeIncidents,
  getIncidentStats,
  geocodeAddress,
};