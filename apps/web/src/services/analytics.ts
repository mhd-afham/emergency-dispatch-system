const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export interface IncidentStatus {
  pending: number;
  assigned: number;
  en_route: number;
  on_scene: number;
  resolved: number;
}

export interface IncidentTypes {
  medical: number;
  fire: number;
  rescue: number;
  other: number;
}

export interface CrewStatus {
  available: number;
  onDuty: number;
  total: number;
}

export interface VehicleStatus {
  ready: number;
  maintenance: number;
  outOfService: number;
  total: number;
}

export interface LocationHotspot {
  district: string;
  count: number;
}

export interface AnalyticsSummary {
  totalIncidentsToday: number;
  averageResponseTime: string;
  activeUnits: string;
  resolutionRate: string;
  incidentStatus: IncidentStatus;
  incidentTypes: IncidentTypes;
  crewStatus: CrewStatus;
  vehicleStatus: VehicleStatus;
  topLocations: LocationHotspot[];
}

class AnalyticsService {
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async getSummary(): Promise<AnalyticsSummary> {
    const response = await fetch(`${API_BASE_URL}/analytics/summary`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get analytics summary: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to get analytics summary');
    }

    return data.data;
  }
}

export const analyticsService = new AnalyticsService();
export default AnalyticsService;
