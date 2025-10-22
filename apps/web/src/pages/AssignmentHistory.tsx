import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import assignmentHistoryService, {
  AssignmentHistoryFilters,
  Statistics,
} from "../services/assignmentHistoryService";
import toast from "react-hot-toast";
import {
  MdArrowBack,
  MdSearch,
  MdFilterList,
  MdDelete,
  MdPictureAsPdf,
  MdAssignment,
  MdCheckCircle,
  MdCancel,
  MdRefresh,
  MdWarning,
  MdNavigateBefore,
  MdNavigateNext,
  MdClose,
  MdLocalHospital,
  MdFireTruck,
  MdLocationOn,
  MdPerson,
  MdAccessTime,
  MdCalendarToday,
  MdSpeed,
} from "react-icons/md";

const AssignmentHistory: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [assignments, setAssignments] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [filters, setFilters] = useState<AssignmentHistoryFilters>({
    page: 1,
    limit: 20,
    sortBy: "dispatch.assignedAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    totalItems: 0,
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFields, setSearchFields] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    assignment: any | null;
  }>({ isOpen: false, assignment: null });
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(
    "allTime"
  );

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Date range presets
  const getDatePreset = (preset: string) => {
    const today = new Date();
    const result = { dateFrom: "", dateTo: formatLocalDate(today) };

    switch (preset) {
      case "allTime":
        result.dateFrom = "";
        result.dateTo = "";
        break;
      case "today":
        result.dateFrom = formatLocalDate(today);
        break;
      case "7days":
        const week = new Date(today);
        week.setDate(week.getDate() - 7);
        result.dateFrom = formatLocalDate(week);
        break;
      case "30days":
        const month = new Date(today);
        month.setDate(month.getDate() - 30);
        result.dateFrom = formatLocalDate(month);
        break;
      case "thisMonth":
        // Create date at start of current month in local timezone
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        result.dateFrom = formatLocalDate(firstDay);
        break;
      default:
        return null;
    }
    return result;
  };

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assignmentHistoryService.getAssignmentHistory(filters);
      setAssignments(data.assignments);
      setPagination(data.pagination);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await assignmentHistoryService.getStatistics(
        filters.dateFrom,
        filters.dateTo
      );
      setStatistics(stats);
    } catch (error: any) {
      console.error("Failed to fetch statistics:", error);
    }
  }, [filters.dateFrom, filters.dateTo]);

  // Load data on mount and filter changes
  useEffect(() => {
    fetchAssignments();
    fetchStatistics();
  }, [fetchAssignments, fetchStatistics]);

  // Sync searchFields with filters
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      searchFields: searchFields.length > 0 ? searchFields : undefined,
      page: 1, // Reset to first page when search scope changes
    }));
  }, [searchFields]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
    // Clear active preset when manually changing dates
    if (key === "dateFrom" || key === "dateTo") {
      setActiveDatePreset(null);
    }
  };

  // Toggle array filter (for checkboxes)
  const toggleArrayFilter = (key: string, value: string) => {
    const currentValues =
      (filters[key as keyof AssignmentHistoryFilters] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    handleFilterChange(key, newValues);
  };

  // Handle date preset
  const handleDatePreset = (preset: string) => {
    const dates = getDatePreset(preset);
    if (dates) {
      setFilters((prev) => ({
        ...prev,
        dateFrom: dates.dateFrom,
        dateTo: dates.dateTo,
        page: 1,
      }));
      setActiveDatePreset(preset);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteModal.assignment) return;

    try {
      await assignmentHistoryService.deleteAssignment(
        deleteModal.assignment._id
      );
      toast.success("Assignment deleted successfully");
      setDeleteModal({ isOpen: false, assignment: null });
      fetchAssignments();
      fetchStatistics();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete assignment");
    }
  };

  // Format time
  const formatDuration = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined) return "N/A";
    if (seconds === 0) return "0s";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    if (mins === 0) {
      return `${secs}s`;
    } else if (secs === 0) {
      return `${mins}m`;
    } else {
      return `${mins}m ${secs}s`;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge style
  const getStatusStyle = (status: string) => {
    const styles: { [key: string]: { bg: string; text: string; icon: any } } = {
      completed: {
        bg: "bg-green-50",
        text: "text-green-700",
        icon: MdCheckCircle,
      },
      cancelled: { bg: "bg-red-50", text: "text-red-700", icon: MdCancel },
      declined: { bg: "bg-gray-50", text: "text-gray-700", icon: MdCancel },
      returned: { bg: "bg-blue-50", text: "text-blue-700", icon: MdRefresh },
    };
    return (
      styles[status] || {
        bg: "bg-gray-50",
        text: "text-gray-700",
        icon: MdAssignment,
      }
    );
  };

  // Get priority badge style
  const getPriorityStyle = (priority: string) => {
    const styles: { [key: string]: { bg: string; text: string } } = {
      critical: { bg: "bg-red-600", text: "text-white" },
      high: { bg: "bg-orange-500", text: "text-white" },
      medium: { bg: "bg-yellow-500", text: "text-white" },
      low: { bg: "bg-green-600", text: "text-white" },
    };
    return styles[priority] || { bg: "bg-gray-500", text: "text-white" };
  };

  // Generate PDF Report
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      toast.loading("Generating comprehensive PDF report...", { id: "report" });

      // Create a simple report using the browser's print functionality
      // This is a simplified approach - full PDF generation would require a backend endpoint
      const reportWindow = window.open("", "_blank");
      if (!reportWindow) {
        throw new Error("Pop-up blocked. Please allow pop-ups for this site.");
      }

      // Generate report HTML
      const reportHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Assignment History Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              h1 { color: #1e3a8a; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
              h2 { color: #1e40af; margin-top: 30px; }
              .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
              .stat-card { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; }
              .stat-value { font-size: 32px; font-weight: bold; color: #2563eb; }
              .stat-label { color: #6b7280; margin-top: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
              th { background: #f3f4f6; font-weight: 600; }
              .header-info { margin-bottom: 30px; color: #6b7280; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <h1>📊 Comprehensive Assignment History Report</h1>
            <div class="header-info">
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Date Range:</strong> ${filters.dateFrom || "All"} to ${
        filters.dateTo || "Today"
      }</p>
              <p><strong>Total Records:</strong> ${pagination.totalRecords}</p>
            </div>

            <h2>Executive Summary</h2>
            <div class="stats">
              <div class="stat-card">
                <div class="stat-value">${
                  statistics?.totalAssignments || 0
                }</div>
                <div class="stat-label">Total Assignments</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${
                  (statistics?.byStatus?.completed || 0) +
                  (statistics?.byStatus?.returned || 0)
                }</div>
                <div class="stat-label">Completed (Including Returned)</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${
                  statistics?.byStatus?.cancelled || 0
                }</div>
                <div class="stat-label">Cancelled</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${
                  statistics?.performance?.avgResponseTime || 0
                } min</div>
                <div class="stat-label">Avg Response Time</div>
              </div>
            </div>

            <h2>Assignment Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Assignment ID</th>
                  <th>Incident ID</th>
                  <th>Type</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${assignments
                  .map(
                    (a) => `
                  <tr>
                    <td>${a.assignmentId || "N/A"}</td>
                    <td>${a.incident?.incidentId || "N/A"}</td>
                    <td>${a.incident?.type || "N/A"}</td>
                    <td>${a.resource?.vehiclePlateNumber || "N/A"}</td>
                    <td>${a.response?.status || a.status || "N/A"}</td>
                    <td>${a.dispatch?.priority || "N/A"}</td>
                    <td>${new Date(
                      a.dispatch?.assignedAt
                    ).toLocaleString()}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>

            <div style="margin-top: 40px; text-align: center;">
              <button onclick="window.print()" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
                Print / Save as PDF
              </button>
            </div>
          </body>
        </html>
      `;

      reportWindow.document.write(reportHTML);
      reportWindow.document.close();

      toast.success("Report generated successfully!", { id: "report" });
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast.error(error.message || "Failed to generate report", {
        id: "report",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  // Get incident icon
  const getIncidentIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      medical: MdLocalHospital,
      fire: MdFireTruck,
      rescue: MdLocalHospital,
      hazmat: MdWarning,
      traffic: MdWarning,
      other: MdWarning,
    };
    return icons[type] || MdWarning;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header with gradient */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <MdArrowBack className="text-xl" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MdAssignment className="text-blue-600 text-4xl" />
                Assignment History & Reports
              </h1>
              <p className="text-gray-600 mt-2">
                View, search, and manage historical assignments with advanced
                filtering
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Statistics Dashboard */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Assignments Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Total Assignments
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.totalAssignments}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <MdAssignment className="text-3xl text-blue-600" />
                </div>
              </div>
            </div>

            {/* Completed Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Completed
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {(statistics?.byStatus?.completed || 0) +
                      (statistics?.byStatus?.returned || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {statistics.totalAssignments > 0
                      ? Math.round(
                          (((statistics?.byStatus?.completed || 0) +
                            (statistics?.byStatus?.returned || 0)) /
                            statistics.totalAssignments) *
                            100
                        )
                      : 0}
                    % completion rate
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <MdCheckCircle className="text-3xl text-green-600" />
                </div>
              </div>
            </div>

            {/* Cancelled Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Cancelled
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {statistics?.byStatus?.cancelled || 0}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <MdCancel className="text-3xl text-red-600" />
                </div>
              </div>
            </div>

            {/* Avg Response Time Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Avg Response Time
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatDuration(
                      statistics?.performance?.avgResponseTime || null
                    )}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <MdSpeed className="text-3xl text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Search and Filters Panel */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar with Icon and Clear Button */}
              <div className="flex-1 relative">
                <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="Search by Assignment ID, Incident ID, Vehicle, Crew Leader, or Location..."
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={filters.search || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
                {/* Clear Search Button */}
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange("search", "")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <MdClose className="text-xl" />
                  </button>
                )}
              </div>

              {/* Advanced Search Toggle Button */}
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  showAdvancedSearch
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <MdSearch className="text-xl" />
                <span>{showAdvancedSearch ? "Hide" : "Advanced"} Search</span>
              </button>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  showFilters
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <MdFilterList className="text-xl" />
                <span>{showFilters ? "Hide" : "Show"} Filters</span>
              </button>
            </div>

            {/* Advanced Search Scope Filters */}
            {showAdvancedSearch && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MdSearch className="text-lg text-blue-600" />
                      Search Scope
                    </label>
                    {searchFields.length > 0 && (
                      <button
                        onClick={() => setSearchFields([])}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      {
                        value: "assignmentId",
                        label: "Assignment ID",
                        icon: MdAssignment,
                      },
                      {
                        value: "incidentId",
                        label: "Incident ID",
                        icon: MdWarning,
                      },
                      {
                        value: "vehiclePlate",
                        label: "Vehicle Plate",
                        icon: MdFireTruck,
                      },
                      {
                        value: "crewLeader",
                        label: "Crew Leader",
                        icon: MdPerson,
                      },
                      {
                        value: "location",
                        label: "Location",
                        icon: MdLocationOn,
                      },
                    ].map((field) => {
                      const Icon = field.icon;
                      const isSelected = searchFields.includes(field.value);
                      return (
                        <label
                          key={field.value}
                          className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSearchFields([...searchFields, field.value]);
                              } else {
                                setSearchFields(
                                  searchFields.filter((f) => f !== field.value)
                                );
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <Icon
                            className={`text-lg ${
                              isSelected ? "text-blue-600" : "text-gray-500"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              isSelected ? "text-blue-700" : "text-gray-700"
                            }`}
                          >
                            {field.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    {searchFields.length === 0 ? (
                      <>
                        <MdCheckCircle className="text-green-600 text-base" />
                        <span>
                          No fields selected - searching in{" "}
                          <strong>all fields</strong>
                        </span>
                      </>
                    ) : (
                      <>
                        <MdFilterList className="text-blue-600 text-base" />
                        <span>
                          Searching in <strong>{searchFields.length}</strong>{" "}
                          selected field{searchFields.length > 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Extended Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 gap-6">
                  {/* Date Range Section */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <MdCalendarToday className="text-lg" />
                      Date Range
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {["allTime", "today", "7days", "30days", "thisMonth"].map(
                        (preset) => (
                          <button
                            key={preset}
                            onClick={() => handleDatePreset(preset)}
                            className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${
                              activeDatePreset === preset
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}
                          >
                            {preset === "allTime" && "All Time"}
                            {preset === "today" && "Today"}
                            {preset === "7days" && "Last 7 Days"}
                            {preset === "30days" && "Last 30 Days"}
                            {preset === "thisMonth" && "This Month"}
                          </button>
                        )
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          From Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={filters.dateFrom || ""}
                          max={
                            filters.dateTo ||
                            new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            handleFilterChange("dateFrom", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          To Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={filters.dateTo || ""}
                          min={filters.dateFrom || undefined}
                          max={new Date().toISOString().split("T")[0]}
                          onChange={(e) =>
                            handleFilterChange("dateTo", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Status
                      </label>
                      {filters.status && filters.status.length > 0 && (
                        <button
                          onClick={() => handleFilterChange("status", [])}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Deselect All
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: "completed", label: "Completed" },
                        { value: "cancelled", label: "Cancelled" },
                        { value: "declined", label: "Declined" },
                        { value: "returned", label: "Returned" },
                      ].map((status) => (
                        <label
                          key={status.value}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            checked={(filters.status || []).includes(
                              status.value
                            )}
                            onChange={() =>
                              toggleArrayFilter("status", status.value)
                            }
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {status.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Priority
                      </label>
                      {filters.priority && filters.priority.length > 0 && (
                        <button
                          onClick={() => handleFilterChange("priority", [])}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Deselect All
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: "critical", label: "Critical" },
                        { value: "high", label: "High" },
                        { value: "medium", label: "Medium" },
                        { value: "low", label: "Low" },
                      ].map((priority) => (
                        <label
                          key={priority.value}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            checked={(filters.priority || []).includes(
                              priority.value
                            )}
                            onChange={() =>
                              toggleArrayFilter("priority", priority.value)
                            }
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {priority.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Incident Type Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Incident Type
                      </label>
                      {filters.incidentType &&
                        filters.incidentType.length > 0 && (
                          <button
                            onClick={() =>
                              handleFilterChange("incidentType", [])
                            }
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Deselect All
                          </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { value: "medical", label: "Medical" },
                        { value: "fire", label: "Fire" },
                        { value: "rescue", label: "Rescue" },
                        { value: "hazmat", label: "Hazmat" },
                        { value: "traffic", label: "Traffic" },
                        { value: "other", label: "Other" },
                      ].map((type) => (
                        <label
                          key={type.value}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            checked={(filters.incidentType || []).includes(
                              type.value
                            )}
                            onChange={() =>
                              toggleArrayFilter("incidentType", type.value)
                            }
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {type.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Vehicle Type Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Vehicle Type
                      </label>
                      {filters.vehicleType &&
                        filters.vehicleType.length > 0 && (
                          <button
                            onClick={() =>
                              handleFilterChange("vehicleType", [])
                            }
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Deselect All
                          </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        "Ambulance",
                        "Fire Engine",
                        "Rescue Vehicle",
                        "Support Vehicle",
                      ].map((vehicleType) => (
                        <label
                          key={vehicleType}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={(filters.vehicleType || []).includes(
                              vehicleType
                            )}
                            onChange={(e) => {
                              const current = filters.vehicleType || [];
                              const updated = e.target.checked
                                ? [...current, vehicleType]
                                : current.filter((v) => v !== vehicleType);
                              handleFilterChange("vehicleType", updated);
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {vehicleType}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() =>
                      setFilters({
                        page: 1,
                        limit: 20,
                        sortBy: "dispatch.assignedAt",
                        sortOrder: "desc",
                      })
                    }
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <MdRefresh className="text-lg" />
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Count and Actions */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-gray-700 font-medium">
            Showing{" "}
            <span className="text-blue-600 font-bold">
              {assignments.length}
            </span>{" "}
            of{" "}
            <span className="text-blue-600 font-bold">
              {pagination.totalItems || pagination.totalRecords || 0}
            </span>{" "}
            assignments
          </div>
          <div className="relative group">
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport || assignments.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdPictureAsPdf className="text-xl" />
              {generatingReport ? "Generating..." : "Generate PDF Report"}
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg z-10">
              <p className="font-medium mb-1">Report includes:</p>
              <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                <li>Current search term</li>
                <li>Selected date range</li>
                <li>Active status filters</li>
                <li>Active priority filters</li>
                <li>Active incident type filters</li>
                <li>Active vehicle type filters</li>
              </ul>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>

        {/* Assignment Cards */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
            <MdAssignment className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl font-medium mb-2">
              No assignments found
            </p>
            <p className="text-gray-400">
              Try adjusting your filters or date range
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const statusStyle = getStatusStyle(assignment.response.status);
              const priorityStyle = getPriorityStyle(
                assignment.dispatch.priority
              );
              const IncidentIcon = getIncidentIcon(
                assignment.incident?.incidentId?.incidentType
              );
              const StatusIcon = statusStyle.icon;

              return (
                <div
                  key={assignment._id}
                  className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-xl transition-all overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <MdAssignment className="text-2xl text-blue-600" />
                          <span className="font-mono font-bold text-xl text-gray-900">
                            {assignment.assignmentId}
                          </span>
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            <StatusIcon className="text-sm" />
                            {assignment.response.status.toUpperCase()}
                          </span>
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}
                          >
                            {assignment.dispatch.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <IncidentIcon className="text-lg" />
                          <span className="font-medium">
                            {assignment.incident?.incidentId?.incidentId ||
                              "N/A"}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span>
                            {assignment.incident?.incidentId?.incidentType ||
                              "Unknown"}{" "}
                            Emergency
                          </span>
                        </div>
                      </div>
                      {assignment.response.status === "cancelled" && (
                        <button
                          onClick={() =>
                            setDeleteModal({ isOpen: true, assignment })
                          }
                          className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center gap-2 border border-red-200"
                        >
                          <MdDelete className="text-lg" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Vehicle & Crew */}
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <MdFireTruck className="text-xl text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Vehicle & Crew
                          </p>
                          <p className="font-semibold text-gray-900">
                            {assignment.resource?.vehicleId?.registration
                              ?.plateNumber || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MdPerson className="text-base" />
                            {assignment.resource?.primaryCrewId?.personal
                              ?.firstName || ""}{" "}
                            {assignment.resource?.primaryCrewId?.personal
                              ?.lastName || ""}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-3">
                        <div className="bg-green-50 p-2 rounded-lg">
                          <MdLocationOn className="text-xl text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Location
                          </p>
                          <p className="font-medium text-gray-900">
                            {assignment.incident?.incidentId?.location
                              ?.address || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Performance */}
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-50 p-2 rounded-lg">
                          <MdSpeed className="text-xl text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Performance
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Response:</span>{" "}
                            {formatDuration(
                              assignment.performance?.responseTime
                            )}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Duration:</span>{" "}
                            {formatDuration(
                              assignment.performance?.totalDuration
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Assigned Date */}
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-50 p-2 rounded-lg">
                          <MdCalendarToday className="text-xl text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Assigned
                          </p>
                          <p className="font-medium text-gray-900">
                            {formatDate(assignment.dispatch.assignedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cancellation Reason */}
                    {assignment.response.status === "cancelled" &&
                      assignment.response.cancellationReason && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <MdWarning className="text-xl text-red-600 mt-0.5" />
                            <div>
                              <p className="font-semibold text-red-900 mb-1">
                                Cancellation Reason
                              </p>
                              <p className="text-sm text-red-700">
                                {assignment.response.cancellationReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modern Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() =>
                handleFilterChange("page", pagination.currentPage - 1)
              }
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              <MdNavigateBefore className="text-xl" />
              Previous
            </button>
            <span className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold">
              {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                handleFilterChange("page", pagination.currentPage + 1)
              }
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              Next
              <MdNavigateNext className="text-xl" />
            </button>
          </div>
        )}
      </div>

      {/* Modern Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <MdWarning className="text-3xl text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Delete Assignment
                  </h3>
                </div>
                <button
                  onClick={() =>
                    setDeleteModal({ isOpen: false, assignment: null })
                  }
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition-colors"
                >
                  <MdClose className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MdAssignment className="text-xl text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Assignment ID
                    </p>
                    <p className="font-mono font-bold text-gray-900">
                      {deleteModal.assignment?.assignmentId}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MdFireTruck className="text-xl text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Vehicle
                    </p>
                    <p className="font-semibold text-gray-900">
                      {deleteModal.assignment?.resource?.vehicleId?.registration
                        ?.plateNumber || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MdAccessTime className="text-xl text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Cancelled
                    </p>
                    <p className="font-medium text-gray-900">
                      {formatDate(
                        deleteModal.assignment?.response?.cancelledAt
                      )}
                    </p>
                  </div>
                </div>
                {deleteModal.assignment?.response?.cancellationReason && (
                  <div className="flex items-start gap-3">
                    <MdWarning className="text-xl text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Reason
                      </p>
                      <p className="text-sm text-gray-700">
                        {deleteModal.assignment.response.cancellationReason}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 font-medium">
                  <MdWarning className="inline text-lg mr-1" />
                  This action is permanent and cannot be undone. The assignment
                  record will be permanently deleted from the system.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setDeleteModal({ isOpen: false, assignment: null })
                  }
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <MdDelete className="text-lg" />
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentHistory;
