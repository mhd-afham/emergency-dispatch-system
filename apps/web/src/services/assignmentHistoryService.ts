/**
 * Assignment History Service
 * Handles API calls for assignment history, statistics, and reports
 */

const API_BASE_URL = "http://localhost:5000/api";

export interface AssignmentHistoryFilters {
  search?: string;
  assignmentId?: string;
  incidentId?: string;
  vehiclePlateNumber?: string;
  crewLeaderName?: string;
  status?: string[];
  priority?: string[];
  incidentType?: string[];
  vehicleType?: string[];
  dateFrom?: string;
  dateTo?: string;
  responseTimeMin?: number;
  responseTimeMax?: number;
  totalDurationMin?: number;
  totalDurationMax?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface Statistics {
  totalAssignments: number;
  byStatus: { [key: string]: number };
  byPriority: { [key: string]: number };
  byIncidentType: { [key: string]: number };
  byVehicleType: { [key: string]: number };
  performance: {
    avgResponseTime: number | null;
    avgArrivalTime: number | null;
    avgOnSceneTime: number | null;
    avgTotalDuration: number | null;
    minResponseTime: number | null;
    maxResponseTime: number | null;
  };
  resolutionRate: number;
  dailyTrends: Array<{ date: string; count: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
}

class AssignmentHistoryService {
  /**
   * Fetch assignment history with filters
   */
  async getAssignmentHistory(filters: AssignmentHistoryFilters) {
    try {
      const token = localStorage.getItem("token");

      // Build query string
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, v));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(
        `${API_BASE_URL}/assignments/history?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch assignment history");
      }

      return result.data;
    } catch (error: any) {
      console.error("Error fetching assignment history:", error);
      throw error;
    }
  }

  /**
   * Fetch statistics for dashboard
   */
  async getStatistics(dateFrom?: string, dateTo?: string): Promise<Statistics> {
    try {
      const token = localStorage.getItem("token");

      const queryParams = new URLSearchParams();
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);

      const response = await fetch(
        `${API_BASE_URL}/assignments/statistics?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch statistics");
      }

      return result.data;
    } catch (error: any) {
      console.error("Error fetching statistics:", error);
      throw error;
    }
  }

  /**
   * Delete assignment (only for cancelled assignments)
   */
  async deleteAssignment(assignmentId: string) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/assignments/${assignmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to delete assignment");
      }

      return result.data;
    } catch (error: any) {
      console.error("Error deleting assignment:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const assignmentHistoryServiceInstance = new AssignmentHistoryService();
export default assignmentHistoryServiceInstance;
