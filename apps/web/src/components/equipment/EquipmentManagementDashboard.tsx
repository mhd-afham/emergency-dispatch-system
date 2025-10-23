import React, { useState, useEffect } from "react";
import { equipmentService } from "../../services/equipment";
import ManualChecklistModal from "./ManualChecklistModal";

interface EquipmentManagementDashboardProps {
  className?: string;
}

const EquipmentManagementDashboard: React.FC<
  EquipmentManagementDashboardProps
> = ({ className = "" }) => {
  // State Management
  const [activeTab, setActiveTab] = useState<"maintenance" | "checks">(
    "maintenance"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>({ show: false, type: "info", message: "" });

  // Maintenance Records
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleStats, setVehicleStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
  });
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicleId: "",
    recordType: "ROUTINE" as "ROUTINE" | "CORRECTIVE" | "EMERGENCY",
    description: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
  });

  // Equipment Checks
  const [equipmentChecks, setEquipmentChecks] = useState<any[]>([]);

  // Manual Checklist State
  const [showManualChecklistModal, setShowManualChecklistModal] = useState(false);
  const [checklistVehicleId, setChecklistVehicleId] = useState("");
  const [checklistValues, setChecklistValues] = useState<Record<string, any>>({});
  const [checklistResults, setChecklistResults] = useState<any>(null);
  const [isSubmittingChecklist, setIsSubmittingChecklist] = useState(false);

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    id: string | null;
  }>({ show: false, id: null });

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("");
  const [filterRecordType, setFilterRecordType] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    loadVehicles();
    // Also load equipment checks on mount
    loadEquipmentChecks();
  }, []);

  useEffect(() => {
    if (activeTab === "maintenance") {
      loadMaintenanceRecords();
    } else if (activeTab === "checks") {
      loadEquipmentChecks();
    }
  }, [activeTab]);

  const loadVehicles = async () => {
    try {
      const vehicleData = await equipmentService.getAllVehicles();
      setVehicles(vehicleData || []);
      
      // Calculate vehicle statistics
      const total = vehicleData?.length || 0;
      const active = vehicleData?.filter((v: any) => v.status?.operational === 'active')?.length || 0;
      const maintenance = vehicleData?.filter((v: any) => v.status?.operational === 'maintenance')?.length || 0;
      
      setVehicleStats({ total, active, maintenance });
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    }
  };

  const loadMaintenanceRecords = async () => {
    try {
      const params: any = { limit: 50 };
      
      if (filterVehicle) params.vehicleId = filterVehicle;
      if (filterStatus) params.status = filterStatus;
      
      const maintenanceData = await equipmentService.getAllMaintenanceRecords(params);
      setMaintenanceRecords(maintenanceData.maintenanceRecords || []);
    } catch (err) {
      console.error("Failed to load maintenance records:", err);
    }
  };

  const loadEquipmentChecks = async () => {
    try {
      console.log('📋 Loading equipment checks...');
      console.log('📋 API URL:', process.env.REACT_APP_API_URL || "http://localhost:5000/api");
      console.log('📋 JWT Token:', localStorage.getItem("token") ? "EXISTS" : "MISSING");
      
      const checksData = await equipmentService.getAllEquipmentChecks({
        page: 1,
        limit: 50,
      });
      
      console.log('📋 RAW Response:', checksData);
      console.log('📋 Equipment checks array:', checksData.equipmentChecks);
      console.log('📋 Number of checks:', checksData.equipmentChecks?.length || 0);
      
      setEquipmentChecks(checksData.equipmentChecks || []);
    } catch (err) {
      console.error("❌ Failed to load equipment checks:", err);
      // Show error to user
      showToast("error", "Failed to load equipment checks: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const showToast = (
    type: "success" | "error" | "warning" | "info",
    message: string
  ) => {
    setToast({ show: true, type, message });
    setTimeout(
      () => setToast({ show: false, type: "info", message: "" }),
      4000
    );
  };

  const handleCreateMaintenance = async () => {
    try {
      if (!maintenanceForm.vehicleId || !maintenanceForm.description) {
        showToast("warning", "Please fill in all required fields");
        return;
      }

      await equipmentService.createMaintenanceRecord({
        ...maintenanceForm,
        createdBy: "current-user",
      });

      setShowMaintenanceModal(false);
      setMaintenanceForm({
        vehicleId: "",
        recordType: "ROUTINE",
        description: "",
        priority: "MEDIUM",
      });
      loadMaintenanceRecords();
      showToast("success", "Maintenance record created successfully!");
    } catch (err) {
      showToast(
        "error",
        "Failed to create maintenance record: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const handleUpdateMaintenance = async (id: string) => {
    try {
      if (!maintenanceForm.vehicleId || !maintenanceForm.description) {
        showToast("warning", "Please fill in all required fields");
        return;
      }

      await equipmentService.updateMaintenanceRecord(id, {
        ...maintenanceForm,
      });

      setShowMaintenanceModal(false);
      setEditingRecord(null);
      setMaintenanceForm({
        vehicleId: "",
        recordType: "ROUTINE",
        description: "",
        priority: "MEDIUM",
      });
      loadMaintenanceRecords();
      showToast("success", "Maintenance record updated successfully!");
    } catch (err) {
      showToast(
        "error",
        "Failed to update maintenance record: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const handleCompleteMaintenance = async (recordId: string) => {
    try {
      // Update the maintenance record status to COMPLETED
      await equipmentService.updateMaintenanceRecord(recordId, {
        status: "COMPLETED",
      });

      loadMaintenanceRecords();
      showToast("success", "Maintenance marked as completed! Vehicle status changed to active.");
    } catch (err) {
      showToast(
        "error",
        "Failed to complete maintenance record: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const handleDeleteMaintenance = async () => {
    if (!deleteConfirm.id) return;

    try {
      await equipmentService.deleteMaintenanceRecord(deleteConfirm.id);

      // Close confirmation dialog
      setDeleteConfirm({ show: false, id: null });

      // Immediately update the list by removing the deleted item
      setMaintenanceRecords((prevRecords) =>
        prevRecords.filter((record) => record._id !== deleteConfirm.id)
      );

      // Show success message
      showToast("success", "Maintenance record deleted successfully! Vehicle status changed to active.");
    } catch (err) {
      console.error("Delete error:", err);
      showToast(
        "error",
        "Failed to delete maintenance record: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const handleSearch = () => {
    loadMaintenanceRecords();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterVehicle("");
    setFilterRecordType("");
    setFilterPriority("");
    setFilterStatus("");
    // Reload without filters
    setTimeout(() => loadMaintenanceRecords(), 100);
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      // Check if there are records to report
      const filteredRecords = getFilteredRecords();
      if (filteredRecords.length === 0) {
        showToast("warning", "No records to generate report");
        return;
      }

      // Prepare filters for API call
      const filters: any = {};
      if (filterVehicle) filters.vehicleId = filterVehicle;
      if (filterRecordType) filters.recordType = filterRecordType;
      if (filterPriority) filters.priority = filterPriority;
      if (filterStatus) filters.status = filterStatus;

      // Call backend to Download PDF
      const pdfBlob = await equipmentService.generateMaintenanceReport(filters);
      
      // Download PDF file
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maintenance-report-${new Date().toISOString().split('T')[0]}.pdf`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast("success", "PDF report generated successfully!");
    } catch (err) {
      showToast("error", "Failed to generate report: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSubmitManualChecklist = async () => {
    try {
      setIsSubmittingChecklist(true);

      if (!checklistVehicleId) {
        showToast("error", "Please select a vehicle");
        return;
      }

      // DISABLED: Delete existing checklist records
      // We'll keep all historical records instead of deleting them
      console.log('📝 Creating new checklist (keeping old records for history)');

      // Import check items configuration
      const { CHECK_ITEMS, validateCheckItem } = await import('../../config/checkItemsConfig');
      
      // Validate all check items
      const results: any[] = [];
      let overallPass = true;
      let criticalFailures: string[] = [];
      let warnings: string[] = [];

      CHECK_ITEMS.forEach(item => {
        const value = checklistValues[item.id];
        const validation = validateCheckItem(item, value);
        
        results.push({
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          value: value,
          pass: validation.pass,
          message: validation.message,
          critical: item.critical
        });

        if (!validation.pass) {
          if (item.critical) {
            criticalFailures.push(`${item.name}: ${validation.message}`);
            overallPass = false;
          } else {
            warnings.push(`${item.name}: ${validation.message}`);
          }
        }
      });

      // Store results for display
      setChecklistResults({
        overallPass,
        criticalFailures,
        warnings,
        results
      });

      // Get checklist template for the vehicle
      let templateId = '';
      try {
        const templateData = await equipmentService.getChecklistTemplate(checklistVehicleId);
        templateId = templateData.template._id;
      } catch (err) {
        console.warn("Could not fetch template, will try to continue without it:", err);
      }

      // Create equipment check record to display in list
      try {
        console.log('📝 Creating equipment check record...');
        console.log('📝 Vehicle ID:', checklistVehicleId);
        console.log('📝 Template ID:', templateId || checklistVehicleId);
        console.log('📝 Results count:', results.length);
        
        // Convert results to EquipmentCheckResult format
        const checkResults = results.map((result: any) => ({
          categoryName: result.category,
          itemName: result.itemName,
          status: (result.pass ? 'pass' : (result.critical ? 'fail' : 'warning')) as "pass" | "fail" | "warning" | "not_applicable" | "skipped",
          actualValue: String(result.value || ''),
          notes: result.message || '',
          isCritical: result.critical
        }));

        console.log('📝 Formatted check results:', checkResults);

        // Create the equipment check
        const createdCheck = await equipmentService.createEquipmentCheck({
          vehicleId: checklistVehicleId,
          templateId: templateId || checklistVehicleId, // Use vehicleId as fallback if no template
          checkResults: checkResults,
          notes: `Manual checklist. ${overallPass ? 'Passed' : 'Failed'} - ${results.length} items checked.`
        });

        console.log('✅ Equipment check record created successfully:', createdCheck);
      } catch (err) {
        console.error("❌ Failed to create equipment check record:", err);
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        console.error("❌ Error details:", errorMsg);
        showToast("error", "Failed to save checklist: " + errorMsg);
        throw err; // Stop execution here
      }

      // If checklist failed, create maintenance record automatically
      if (!overallPass) {
        const maintenanceDescription = `Equipment checklist failed. Critical issues:\n${criticalFailures.join('\n')}`;
        
        try {
          await equipmentService.createMaintenanceRecord({
            vehicleId: checklistVehicleId,
            recordType: 'CORRECTIVE',
            description: maintenanceDescription,
            priority: 'HIGH',
          });
          
          showToast("warning", `Checklist FAILED. Vehicle marked for maintenance. Maintenance record created automatically.`);
        } catch (err) {
          showToast("error", "Checklist failed but couldn't create maintenance record: " + (err instanceof Error ? err.message : "Unknown error"));
        }
      } else if (warnings.length > 0) {
        showToast("success", `Checklist PASSED with ${warnings.length} warning(s). Vehicle is operational.`);
      } else {
        showToast("success", "Checklist PASSED! All systems check out. Vehicle is ready for service.");
      }

      // Reload data including equipment checks
      await loadVehicles();
      await loadMaintenanceRecords();
      await loadEquipmentChecks();

      // Close the modal after successful submission
      handleCloseManualChecklist();

    } catch (err) {
      showToast("error", "Failed to process checklist: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsSubmittingChecklist(false);
    }
  };

  const handleOpenManualChecklist = (vehicleId?: string) => {
    setChecklistVehicleId(vehicleId || "");
    setChecklistValues({});
    setChecklistResults(null);
    setShowManualChecklistModal(true);
  };

  const handleCloseManualChecklist = () => {
    setShowManualChecklistModal(false);
    setChecklistVehicleId("");
    setChecklistValues({});
    setChecklistResults(null);
  };

  const getFilteredRecords = () => {
    return maintenanceRecords.filter(record => {
      // Search term filter (searches in description and vehicle number)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          record.description?.toLowerCase().includes(searchLower) ||
          record.vehicleId?.registration?.plateNumber?.toLowerCase().includes(searchLower) ||
          record.createdBy?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Record type filter
      if (filterRecordType && record.recordType !== filterRecordType) {
        return false;
      }
      
      // Priority filter
      if (filterPriority && record.priority !== filterPriority) {
        return false;
      }
      
      return true;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600 bg-red-100";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-100";
      case "LOW":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 bg-green-100";
      case "IN_PROGRESS":
        return "text-blue-600 bg-blue-100";
      case "PENDING":
        return "text-yellow-600 bg-yellow-100";
      case "CANCELLED":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header - Clean and Simple */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Equipment Management
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage vehicle readiness, maintenance records, and equipment
          inspections
        </p>
      </div>

      {/* Vehicle Statistics Cards */}
      <div className="px-6 py-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Vehicles Card */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Vehicles
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {vehicleStats.total}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Vehicles Card */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Available Vehicles
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {vehicleStats.active}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Maintenance Vehicles Card */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  In Maintenance
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {vehicleStats.maintenance}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - 2 Tabs Only */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "maintenance"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            🔧 Maintenance Records
          </button>
          <button
            onClick={() => setActiveTab("checks")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "checks"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            ✅ Equipment Checks
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Maintenance Records Tab */}
        {activeTab === "maintenance" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Maintenance Records
              </h3>
              <button
                onClick={() => {
                  setEditingRecord(null);
                  setShowMaintenanceModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                + New Maintenance Record
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              {/* Search Bar */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="🔍 Search by vehicle number, description, or creator..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Search
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport || getFilteredRecords().length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGeneratingReport ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      � Download PDF
                    </>
                  )}
                </button>
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select
                  value={filterVehicle}
                  onChange={(e) => setFilterVehicle(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">All Vehicles</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.registration?.plateNumber}
                    </option>
                  ))}
                </select>

                <select
                  value={filterRecordType}
                  onChange={(e) => setFilterRecordType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="ROUTINE">ROUTINE</option>
                  <option value="CORRECTIVE">CORRECTIVE</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  🔄 Reset Filters
                </button>
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600">
                Showing {getFilteredRecords().length} of {maintenanceRecords.length} records
              </div>
            </div>

            {getFilteredRecords().length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">🔧</div>
                <p className="text-xl mb-2 font-medium">
                  No maintenance records found
                </p>
                <p className="text-sm">
                  Create a new maintenance record to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Vehicle
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {getFilteredRecords().map((record: any) => (
                      <tr
                        key={record._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {record.vehicleId?.registration?.plateNumber || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {record.recordType}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {record.description}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                              record.priority
                            )}`}
                          >
                            {record.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              record.status
                            )}`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            {(record.status === "PENDING" || record.status === "IN_PROGRESS") && (
                              <button
                                onClick={() => handleCompleteMaintenance(record._id)}
                                className="text-green-600 hover:text-green-900 text-sm font-medium transition-colors"
                                title="Mark as Completed"
                              >
                                ✓ Complete
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingRecord(record);
                                setMaintenanceForm({
                                  vehicleId: record.vehicleId?._id || "",
                                  recordType: record.recordType,
                                  description: record.description,
                                  priority: record.priority,
                                });
                                setShowMaintenanceModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({ show: true, id: record._id })
                              }
                              className="text-red-600 hover:text-red-900 text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Equipment Checks Tab */}
        {activeTab === "checks" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Equipment Checks
              </h3>
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => handleOpenManualChecklist()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  + Checklist
                </button>
                <p className="text-sm text-gray-500">
                  or use mobile app for equipment checks
                </p>
              </div>
            </div>

            {/* Debug Info - Remove after testing */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-yellow-800">🔍 Debug Info:</p>
              <p className="text-yellow-700">Equipment Checks Array Length: {equipmentChecks.length}</p>
              <p className="text-yellow-700">Equipment Checks Data: {JSON.stringify(equipmentChecks).substring(0, 200)}...</p>
            </div>

            {equipmentChecks.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-xl mb-2 font-medium">
                  No equipment checks found
                </p>
                <p className="text-sm">
                  Perform a new equipment check to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Vehicle
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Inspector
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Results
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {equipmentChecks.map((check: any) => (
                      <tr
                        key={check._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-gray-900">
                            {check.vehicleId?.registration?.plateNumber ||
                              "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {check.vehicleId?.type}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {check.crewId?.personal?.firstName || "N/A"}{" "}
                          {check.crewId?.personal?.lastName || ""}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              check.inspection?.overallStatus === "pass"
                                ? "text-green-600 bg-green-100"
                                : check.inspection?.overallStatus === "conditional"
                                ? "text-yellow-600 bg-yellow-100"
                                : "text-red-600 bg-red-100"
                            }`}
                          >
                            {check.inspection?.overallStatus?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-green-600">
                            ✓ {check.inspection?.passCount}
                          </span>
                          {check.inspection?.failCount > 0 && (
                            <span className="text-red-600 ml-2">
                              ✗ {check.inspection?.failCount}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(
                            check.audit?.createdAt
                          ).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRecord
                  ? "Edit Maintenance Record"
                  : "New Maintenance Record"}
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle <span className="text-red-500">*</span>
                </label>
                <select
                  value={maintenanceForm.vehicleId}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      vehicleId: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.registration?.plateNumber || 'Unknown'} - {vehicle.registration?.vehicleType || 'Unknown Type'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Record Type
                </label>
                <select
                  value={maintenanceForm.recordType}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      recordType: e.target.value as any,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ROUTINE">ROUTINE</option>
                  <option value="CORRECTIVE">CORRECTIVE</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={maintenanceForm.priority}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      priority: e.target.value as any,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={maintenanceForm.description}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Describe the maintenance work required..."
                  required
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setEditingRecord(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingRecord) {
                    handleUpdateMaintenance(editingRecord._id);
                  } else {
                    handleCreateMaintenance();
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingRecord ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg
                  className="w-6 h-6 text-red-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.96-1.333-2.73 0L3.732 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Confirm Delete
              </h3>
            </div>

            <div className="px-6 py-4">
              <p className="text-gray-700">
                Are you sure you want to delete this maintenance record? This
                action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMaintenance}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div
            className={`rounded-lg shadow-lg p-4 max-w-md flex items-start ${
              toast.type === "success"
                ? "bg-green-50 border-l-4 border-green-500"
                : toast.type === "error"
                ? "bg-red-50 border-l-4 border-red-500"
                : toast.type === "warning"
                ? "bg-yellow-50 border-l-4 border-yellow-500"
                : "bg-blue-50 border-l-4 border-blue-500"
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === "success" && (
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {toast.type === "error" && (
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {toast.type === "warning" && (
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.96-1.333-2.73 0L3.732 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
              {toast.type === "info" && (
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p
                className={`text-sm font-medium ${
                  toast.type === "success"
                    ? "text-green-800"
                    : toast.type === "error"
                    ? "text-red-800"
                    : toast.type === "warning"
                    ? "text-yellow-800"
                    : "text-blue-800"
                }`}
              >
                {toast.message}
              </p>
            </div>
            <button
              onClick={() =>
                setToast({ show: false, type: "info", message: "" })
              }
              className="ml-4 flex-shrink-0"
            >
              <svg
                className="w-5 h-5 text-gray-400 hover:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Manual Checklist Modal */}
      <ManualChecklistModal
        show={showManualChecklistModal}
        vehicles={vehicles}
        selectedVehicleId={checklistVehicleId}
        checklistValues={checklistValues}
        checklistResults={checklistResults}
        isSubmitting={isSubmittingChecklist}
        onClose={handleCloseManualChecklist}
        onVehicleChange={setChecklistVehicleId}
        onValueChange={(itemId, value) => {
          setChecklistValues(prev => ({ ...prev, [itemId]: value }));
        }}
        onSubmit={handleSubmitManualChecklist}
      />
    </div>
  );
};

export default EquipmentManagementDashboard;
