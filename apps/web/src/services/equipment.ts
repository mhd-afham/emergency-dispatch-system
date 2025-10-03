const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export interface EquipmentCheckResult {
  categoryName: string;
  itemName: string;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable' | 'skipped';
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
    overallStatus: 'passed' | 'minor_issues' | 'critical_failure';
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
    return localStorage.getItem('token');
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async getEquipmentStatistics(timeframe: string = 'week'): Promise<EquipmentStatistics> {
    const response = await fetch(`${API_BASE_URL}/equipment/statistics?timeframe=${timeframe}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get equipment statistics: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to get equipment statistics');
    }

    return data.data;
  }

  async getAllEquipmentChecks(params: {
    page?: number;
    limit?: number;
    status?: string;
    vehicleType?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
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
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/equipment/checks?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get equipment checks: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to get equipment checks');
    }

    return data.data;
  }

  async getVehicleEquipmentChecks(vehicleId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
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
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/equipment/checks/vehicle/${vehicleId}?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get vehicle equipment checks: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to get vehicle equipment checks');
    }

    return data.data;
  }

  async getLatestEquipmentCheck(vehicleId: string): Promise<EquipmentCheck> {
    const response = await fetch(`${API_BASE_URL}/equipment/checks/vehicle/${vehicleId}/latest`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get latest equipment check: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to get latest equipment check');
    }

    return data.data.equipmentCheck;
  }

  async getEquipmentCheck(checkId: string): Promise<EquipmentCheck> {
    const response = await fetch(`${API_BASE_URL}/equipment/checks/${checkId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get equipment check: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to get equipment check');
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
    const response = await fetch(`${API_BASE_URL}/equipment/templates/${vehicleId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get checklist template: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to get checklist template');
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
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(checkData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create equipment check: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to create equipment check');
    }

    return data.data;
  }

  /**
   * Get equipment status overview for supervisor dashboard (UC-005)
   * @returns Promise<{ success: boolean, data: EquipmentStatus }>
   */
  async getEquipmentStatus(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/equipment/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.success,
        data: result.data,
      };
    } catch (error) {
      console.error("❌ Equipment status fetch error:", error);
      throw error;
    }
  }

  // ========== MAINTENANCE RECORDS METHODS ==========

  /**
   * Get all maintenance records with optional filters
   */
  async getAllMaintenanceRecords(params?: {
    vehicleId?: string;
    status?: string;
    recordType?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.vehicleId) queryParams.append('vehicleId', params.vehicleId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.recordType) queryParams.append('recordType', params.recordType);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/equipment/maintenance?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get maintenance records: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Create a new maintenance record
   */
  async createMaintenanceRecord(recordData: {
    vehicleId: string;
    recordType: 'ROUTINE' | 'CORRECTIVE' | 'EMERGENCY';
    description: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    createdBy: string;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/equipment/maintenance`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(recordData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create maintenance record: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Update an existing maintenance record
   */
  async updateMaintenanceRecord(id: string, updateData: {
    vehicleId?: string;
    recordType?: 'ROUTINE' | 'CORRECTIVE' | 'EMERGENCY';
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/equipment/maintenance/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update maintenance record: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Delete a maintenance record
   */
  async deleteMaintenanceRecord(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/equipment/maintenance/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete maintenance record: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  // ========== CHECKLIST TEMPLATES METHODS ==========

  /**
   * Get all checklist templates with optional filters
   */
  async getChecklistTemplates(params?: {
    vehicleType?: string;
    isActive?: boolean;
  }): Promise<{ templates: any[]; count: number }> {
    const queryParams = new URLSearchParams();
    if (params?.vehicleType) queryParams.append('vehicleType', params.vehicleType);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const response = await fetch(`${API_BASE_URL}/equipment/checklist-templates?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get checklist templates: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  // ========== VEHICLES METHODS ==========

  /**
   * Get all vehicles for selection in forms
   */
  async getAllVehicles(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/equipment/test-vehicles`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get vehicles: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  // ========== MAINTENANCE SUMMARY METHODS ==========

  /**
   * Get maintenance summary statistics including count of vehicles in maintenance
   */
  async getMaintenanceSummary(): Promise<{
    maintenanceVehiclesCount: number;
    activeMaintenanceRecords: number;
    completedThisWeek: number;
    highPriorityCount: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/equipment/maintenance/summary`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get maintenance summary: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }
}

export const equipmentService = new EquipmentService();
export default EquipmentService;