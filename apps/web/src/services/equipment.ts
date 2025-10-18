const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export interface EquipmentCheckResult {
  categoryName: string;
  itemName: string;
  status: "pass" | "fail" | "warning" | "not_applicable" | "skipped";
  actualValue?: string;
  notes?: string;
  photos?: string[];
  isCritical?: boolean;
}

export interface EquipmentCheck {
  _id: string;
  vehicleId: {
    _id: string;
    registration: {
      plateNumber: string;
    };
    type: string;
    specifications: {
      model: string;
    };
  };
  crewId: {
    _id: string;
    personal: {
      firstName: string;
      lastName: string;
    };
    professional: {
      role: string;
    };
  };
  templateId: {
    _id: string;
    template: {
      name: string;
      version: string;
    };
  };
  inspection: {
    checkResults: EquipmentCheckResult[];
    overallStatus: "passed" | "minor_issues" | "critical_failure";
    criticalFailures: any[];
    passCount: number;
    failCount: number;
    warningCount: number;
    location: {
      coordinates: [number, number];
      address: string;
      capturedAt: Date;
    };
    notes: string;
  };
  workflow: {
    status: string;
    completedAt: Date;
    submittedBy: string;
  };
  audit: {
    createdBy: string;
    createdAt: Date;
    lastModifiedBy: string;
    lastModifiedAt: Date;
  };
}

export interface EquipmentStatistics {
  timeframe: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  statistics: {
    totalChecks: number;
    passedChecks: number;
    criticalFailures: number;
    minorIssues: number;
    avgPassCount: number;
    avgFailCount: number;
    avgWarningCount: number;
    passRate: string;
    failureRate: string;
  };
}

export interface ChecklistTemplate {
  _id: string;
  vehicleType: string;
  template: {
    name: string;
    description: string;
    version: string;
  };
  checklist: {
    categories: Array<{
      name: string;
      description: string;
      items: Array<{
        name: string;
        description: string;
        type: string;
        required: boolean;
        isCritical: boolean;
        expectedValue?: string;
        unit?: string;
        minValue?: number;
        maxValue?: number;
      }>;
    }>;
  };
  status: string;
}

class EquipmentService {
  private getAuthToken(): string | null {
    return localStorage.getItem("token");
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getEquipmentStatistics(
    timeframe: string = "week"
  ): Promise<EquipmentStatistics> {
    const response = await fetch(
      `${API_BASE_URL}/equipment/statistics?timeframe=${timeframe}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get equipment statistics: ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to get equipment statistics");
    }

    return data.data;
  }

  async getAllEquipmentChecks(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      vehicleType?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<{
    equipmentChecks: EquipmentCheck[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalChecks: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/equipment/checks?${queryParams}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get equipment checks: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to get equipment checks");
    }

    return data.data;
  }

  async getVehicleEquipmentChecks(
    vehicleId: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<{
    equipmentChecks: EquipmentCheck[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalChecks: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/equipment/checks/vehicle/${vehicleId}?${queryParams}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get vehicle equipment checks: ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to get vehicle equipment checks");
    }

    return data.data;
  }

  async getLatestEquipmentCheck(vehicleId: string): Promise<EquipmentCheck> {
    const response = await fetch(
      `${API_BASE_URL}/equipment/checks/vehicle/${vehicleId}/latest`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get latest equipment check: ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to get latest equipment check");
    }

    return data.data.equipmentCheck;
  }

  async getEquipmentCheck(checkId: string): Promise<EquipmentCheck> {
    const response = await fetch(
      `${API_BASE_URL}/equipment/checks/${checkId}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get equipment check: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to get equipment check");
    }

    return data.data.equipmentCheck;
  }

  async getChecklistTemplate(vehicleId: string): Promise<{
    template: ChecklistTemplate;
    vehicle: {
      id: string;
      plateNumber: string;
      type: string;
      model: string;
      year: number;
    };
  }> {
    const response = await fetch(
      `${API_BASE_URL}/equipment/templates/${vehicleId}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get checklist template: ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to get checklist template");
    }

    return data.data;
  }

  async createEquipmentCheck(checkData: {
    vehicleId: string;
    templateId: string;
    checkResults: EquipmentCheckResult[];
    location?: {
      coordinates: [number, number];
      address: string;
    };
    notes?: string;
  }): Promise<{
    equipmentCheck: EquipmentCheck;
    summary: {
      overallStatus: string;
      totalItems: number;
      passCount: number;
      failCount: number;
      warningCount: number;
      criticalFailures: number;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/equipment/checks`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(checkData),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create equipment check: ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to create equipment check");
    }

    return data.data;
  }

  // Vehicle Management Methods
  async getAllVehicles(): Promise<any[]> {
    try {
      // For now, return mock data since the backend endpoint doesn't exist yet
      // TODO: Implement backend endpoint /api/vehicles
      console.warn(
        "getAllVehicles: Using mock data - backend endpoint not implemented"
      );
      return [];
    } catch (error) {
      console.error("Failed to get vehicles:", error);
      return [];
    }
  }

  // Maintenance Record Methods
  async getAllMaintenanceRecords(
    params: {
      page?: number;
      limit?: number;
      vehicleId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<{
    maintenanceRecords: any[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
    };
  }> {
    try {
      // For now, return mock data since the backend endpoint doesn't exist yet
      // TODO: Implement backend endpoint /api/equipment/maintenance
      console.warn(
        "getAllMaintenanceRecords: Using mock data - backend endpoint not implemented"
      );
      return {
        maintenanceRecords: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalRecords: 0,
        },
      };
    } catch (error) {
      console.error("Failed to get maintenance records:", error);
      return {
        maintenanceRecords: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalRecords: 0,
        },
      };
    }
  }

  async createMaintenanceRecord(recordData: any): Promise<any> {
    try {
      // For now, just log and return mock data
      // TODO: Implement backend endpoint POST /api/equipment/maintenance
      console.warn(
        "createMaintenanceRecord: Using mock implementation - backend endpoint not implemented"
      );
      console.log("Would create maintenance record:", recordData);
      return { _id: "mock-id", ...recordData };
    } catch (error) {
      console.error("Failed to create maintenance record:", error);
      throw error;
    }
  }

  async updateMaintenanceRecord(id: string, recordData: any): Promise<any> {
    try {
      // For now, just log and return mock data
      // TODO: Implement backend endpoint PUT /api/equipment/maintenance/:id
      console.warn(
        "updateMaintenanceRecord: Using mock implementation - backend endpoint not implemented"
      );
      console.log("Would update maintenance record:", id, recordData);
      return { _id: id, ...recordData };
    } catch (error) {
      console.error("Failed to update maintenance record:", error);
      throw error;
    }
  }

  async deleteMaintenanceRecord(id: string): Promise<void> {
    try {
      // For now, just log
      // TODO: Implement backend endpoint DELETE /api/equipment/maintenance/:id
      console.warn(
        "deleteMaintenanceRecord: Using mock implementation - backend endpoint not implemented"
      );
      console.log("Would delete maintenance record:", id);
    } catch (error) {
      console.error("Failed to delete maintenance record:", error);
      throw error;
    }
  }
}

export const equipmentService = new EquipmentService();
export default EquipmentService;
