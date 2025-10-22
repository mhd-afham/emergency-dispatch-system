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

    const url = `${API_BASE_URL}/equipment/checks?${queryParams}`;
    console.log('🌐 Fetching equipment checks from:', url);
    console.log('🌐 With headers:', this.getAuthHeaders());

    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    console.log('🌐 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🌐 Error response:', errorText);
      throw new Error(`Failed to get equipment checks: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🌐 Response data:', data);
    
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
      // Get error details from response
      let errorMessage = `Failed to create equipment check: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore JSON parse error
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to create equipment check");
    }

    return data.data;
  }

  async deleteVehicleEquipmentChecks(vehicleId: string): Promise<number> {
    const response = await fetch(
      `${API_BASE_URL}/equipment/checks/vehicle/${vehicleId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to delete equipment checks: ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to delete equipment checks");
    }

    return data.data.deletedCount;
  }

  // Vehicle Management Methods
  async getAllVehicles(): Promise<any[]> {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Backend returns { success, data, pagination, message }
      // Note: Backend uses 'data' field, not 'vehicles' field
      if (data.success && data.data) {
        return data.data;
      }
      
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
      const token = localStorage.getItem("token");
      
      // Build query string
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.vehicleId) queryParams.append('vehicleId', params.vehicleId);
      if (params.status) queryParams.append('status', params.status);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const url = `${API_BASE_URL}/equipment/maintenance${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch maintenance records: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Backend returns { success, data: { maintenanceRecords, pagination } }
      if (result.success && result.data) {
        return {
          maintenanceRecords: result.data.maintenanceRecords || [],
          pagination: result.data.pagination,
        };
      }
      
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
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/equipment/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create maintenance record: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Backend returns { success, message, data }
      if (result.success && result.data) {
        return result.data;
      }
      
      throw new Error("Unexpected response format from server");
    } catch (error) {
      console.error("Failed to create maintenance record:", error);
      throw error;
    }
  }

  async updateMaintenanceRecord(id: string, recordData: any): Promise<any> {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/equipment/maintenance/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update maintenance record: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Backend returns { success, message, data }
      if (result.success && result.data) {
        return result.data;
      }
      
      throw new Error("Unexpected response format from server");
    } catch (error) {
      console.error("Failed to update maintenance record:", error);
      throw error;
    }
  }

  async deleteMaintenanceRecord(id: string): Promise<void> {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/equipment/maintenance/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete maintenance record: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Failed to delete maintenance record");
      }
    } catch (error) {
      console.error("Failed to delete maintenance record:", error);
      throw error;
    }
  }

  async generateMaintenanceReport(filters: {
    vehicleId?: string;
    recordType?: string;
    priority?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/equipment/maintenance/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error("Failed to generate maintenance report:", error);
      throw error;
    }
  }

  // ========== MAINTENANCE SEARCH METHODS ==========

  /**
   * Search maintenance records with filters and pagination
   */
  async searchMaintenanceRecords(searchParams: {
    vehicleNumber?: string;
    recordType?: 'ROUTINE' | 'CORRECTIVE' | 'EMERGENCY';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    createdBy?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    records: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    searchCriteria: any;
  }> {
    const response = await fetch(`${API_BASE_URL}/equipment/maintenance/search`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) {
      throw new Error(`Failed to search maintenance records: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Download PDF report for a specific maintenance record
   */
  async downloadMaintenancePDF(recordId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/equipment/maintenance/${recordId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to generate PDF: ${response.statusText}`);
    }

    return await response.blob();
  }

  /**
   * Helper method to trigger PDF download in browser
   */
  async downloadMaintenancePDFFile(recordId: string, filename?: string): Promise<void> {
    try {
      const blob = await this.downloadMaintenancePDF(recordId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `maintenance-record-${recordId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }
}

export const equipmentService = new EquipmentService();
export default EquipmentService;
