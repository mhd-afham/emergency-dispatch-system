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
      toast.loading("Generating PDF report...", { id: "report" });

      const reportWindow = window.open("", "_blank");
      if (!reportWindow) {
        throw new Error("Pop-up blocked. Please allow pop-ups for this site.");
      }

      // Calculate statistics for the report based on filtered assignments
      const totalAssignments = assignments.length;
      const completedCount = assignments.filter(
        (a) =>
          a.response.status === "completed" || a.response.status === "returned"
      ).length;
      const cancelledCount = assignments.filter(
        (a) => a.response.status === "cancelled"
      ).length;
      const declinedCount = assignments.filter(
        (a) => a.response.status === "declined"
      ).length;

      // Calculate completion rate
      const completionRate =
        totalAssignments > 0
          ? ((completedCount / totalAssignments) * 100).toFixed(1)
          : "0.0";

      // Calculate performance metrics from filtered assignments
      let totalResponseTime = 0;
      let totalArrivalTime = 0;
      let totalOnSceneTime = 0;
      let responseCount = 0;
      let arrivalCount = 0;
      let onSceneCount = 0;

      assignments.forEach((assignment) => {
        if (assignment.performance?.responseTime) {
          totalResponseTime += assignment.performance.responseTime;
          responseCount++;
        }
        if (assignment.performance?.arrivalTime) {
          totalArrivalTime += assignment.performance.arrivalTime;
          arrivalCount++;
        }
        if (assignment.performance?.onSceneTime) {
          totalOnSceneTime += assignment.performance.onSceneTime;
          onSceneCount++;
        }
      });

      const avgResponseTime =
        responseCount > 0
          ? Math.round(totalResponseTime / responseCount)
          : null;
      const avgArrivalTime =
        arrivalCount > 0 ? Math.round(totalArrivalTime / arrivalCount) : null;
      const avgOnSceneTime =
        onSceneCount > 0 ? Math.round(totalOnSceneTime / onSceneCount) : null;

      // Format response time
      const formatTime = (seconds: number | null | undefined) => {
        if (!seconds) return "N/A";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      };

      // Generate report HTML with A4 sizing and professional styling
      const reportHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Assignment History Report</title>
            <style>
              /* A4 Page Setup */
              @page {
                size: A4;
                margin: 0;
              }

              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 10pt;
                line-height: 1.4;
                color: #333;
                background: white;
              }

              /* Page Container - A4 dimensions */
              .page {
                width: 210mm;
                min-height: 297mm;
                padding: 20mm 15mm 25mm 15mm;
                margin: 0 auto;
                background: white;
                position: relative;
                page-break-after: always;
              }

              .page:last-child {
                page-break-after: auto;
              }

              /* Header */
              .report-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 15px;
                border-bottom: 3px solid #2563eb;
                margin-bottom: 20px;
              }

              .logo-section {
                flex: 1;
              }

              .logo {
                height: 40px;
                margin-bottom: 8px;
              }

              .report-info {
                text-align: right;
                font-size: 9pt;
                color: #666;
              }

              .report-info h1 {
                font-size: 18pt;
                color: #1e3a8a;
                margin-bottom: 8px;
                font-weight: 600;
              }

              .report-info p {
                margin: 3px 0;
              }

              /* Footer */
              .report-footer {
                position: absolute;
                bottom: 15mm;
                left: 15mm;
                right: 15mm;
                padding-top: 10px;
                border-top: 1px solid #e5e7eb;
                font-size: 8pt;
                color: #666;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }

              /* Summary Section */
              .summary-section {
                margin: 20px 0;
              }

              .summary-title {
                font-size: 13pt;
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 12px;
                padding-bottom: 5px;
                border-bottom: 2px solid #e5e7eb;
              }

              .summary-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 10px;
                margin-bottom: 20px;
              }

              .summary-card {
                border: 1px solid #e5e7eb;
                padding: 12px;
                border-radius: 6px;
                background: #f9fafb;
              }

              .summary-value {
                font-size: 20pt;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 4px;
              }

              .summary-label {
                font-size: 8pt;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              /* Performance Metrics */
              .metrics-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-bottom: 20px;
              }

              .metric-item {
                padding: 10px;
                background: #f3f4f6;
                border-radius: 4px;
                border-left: 3px solid #2563eb;
              }

              .metric-label {
                font-size: 8pt;
                color: #6b7280;
                margin-bottom: 4px;
              }

              .metric-value {
                font-size: 12pt;
                font-weight: 600;
                color: #1e3a8a;
              }

              /* Table Styles */
              .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
                font-size: 9pt;
              }

              .data-table th {
                background: #1e3a8a;
                color: white;
                padding: 10px 8px;
                text-align: left;
                font-weight: 600;
                font-size: 8pt;
                text-transform: uppercase;
                letter-spacing: 0.3px;
              }

              .data-table td {
                padding: 8px;
                border-bottom: 1px solid #e5e7eb;
                vertical-align: top;
              }

              .data-table tr:nth-child(even) {
                background: #f9fafb;
              }

              .data-table tr:hover {
                background: #f3f4f6;
              }

              /* Status Badges */
              .status-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 7pt;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.3px;
              }

              .status-completed { background: #dcfce7; color: #166534; }
              .status-returned { background: #dbeafe; color: #1e40af; }
              .status-cancelled { background: #fee2e2; color: #991b1b; }
              .status-declined { background: #f3f4f6; color: #4b5563; }

              /* Priority Badges */
              .priority-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 7pt;
                font-weight: 600;
                text-transform: uppercase;
                color: white;
              }

              .priority-critical { background: #dc2626; }
              .priority-high { background: #f97316; }
              .priority-medium { background: #eab308; }
              .priority-low { background: #16a34a; }

              /* Print Styles */
              @media print {
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
                .page { page-break-after: always; }
                .page:last-child { page-break-after: auto; }
              }

              /* Print Button */
              .print-button {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 24px;
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 11pt;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 1000;
              }

              .print-button:hover {
                background: #1d4ed8;
              }
            </style>
          </head>
          <body>
            <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>

            <div class="page">
              <!-- Header -->
              <div class="report-header">
                <div class="logo-section">
                  <svg width="180" height="35" viewBox="0 0 622 122" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M161.955 100V32.8H191.715C195.939 32.8 199.715 33.728 203.043 35.584C206.435 37.44 209.123 40 211.107 43.264C213.091 46.464 214.083 50.144 214.083 54.304C214.083 58.336 213.091 61.984 211.107 65.248C209.123 68.512 206.435 71.104 203.043 73.024C199.715 74.944 195.939 75.904 191.715 75.904H175.779V100H161.955ZM200.163 100L183.075 69.568L197.763 67.168L216.771 100.096L200.163 100ZM175.779 64.096H191.139C192.867 64.096 194.371 63.712 195.651 62.944C196.995 62.112 198.019 60.992 198.723 59.584C199.491 58.176 199.875 56.576 199.875 54.784C199.875 52.928 199.427 51.296 198.531 49.888C197.635 48.416 196.387 47.296 194.787 46.528C193.187 45.696 191.331 45.28 189.219 45.28H175.779V64.096ZM249.568 100.96C244.064 100.96 239.232 99.84 235.072 97.6C230.976 95.36 227.776 92.288 225.472 88.384C223.232 84.48 222.112 80.032 222.112 75.04C222.112 71.072 222.752 67.456 224.032 64.192C225.312 60.864 227.104 58.016 229.408 55.648C231.712 53.28 234.432 51.456 237.568 50.176C240.768 48.832 244.256 48.16 248.032 48.16C251.488 48.16 254.656 48.8 257.536 50.08C260.48 51.296 263.008 53.056 265.12 55.36C267.296 57.6 268.96 60.256 270.112 63.328C271.264 66.4 271.808 69.76 271.744 73.408L271.648 77.632H230.848L228.64 69.184H260.416L258.784 70.912V68.896C258.656 67.104 258.08 65.536 257.056 64.192C256.096 62.848 254.848 61.792 253.312 61.024C251.776 60.192 250.08 59.776 248.224 59.776C245.344 59.776 242.912 60.352 240.928 61.504C239.008 62.592 237.536 64.192 236.512 66.304C235.552 68.352 235.072 70.912 235.072 73.984C235.072 76.992 235.712 79.648 236.992 81.952C238.272 84.192 240.096 85.92 242.464 87.136C244.896 88.352 247.744 88.96 251.008 88.96C253.248 88.96 255.296 88.608 257.152 87.904C259.008 87.2 261.024 85.984 263.2 84.256L269.632 93.376C267.84 94.976 265.824 96.352 263.584 97.504C261.344 98.656 259.04 99.52 256.672 100.096C254.304 100.672 251.936 100.96 249.568 100.96ZM298.904 100.96C294.232 100.96 290.04 100.192 286.328 98.656C282.68 97.12 279.704 94.944 277.4 92.128L285.944 84.832C287.928 86.944 290.104 88.48 292.472 89.44C294.904 90.336 297.368 90.784 299.864 90.784C300.76 90.784 301.592 90.688 302.36 90.496C303.128 90.24 303.8 89.92 304.376 89.536C304.952 89.088 305.368 88.576 305.624 88C305.944 87.424 306.104 86.752 306.104 85.984C306.104 84.576 305.528 83.488 304.376 82.72C303.864 82.336 302.904 81.92 301.496 81.472C300.152 80.96 298.424 80.416 296.312 79.84C293.048 79.008 290.296 78.048 288.056 76.96C285.816 75.808 283.992 74.496 282.584 73.024C281.432 71.808 280.536 70.4 279.896 68.8C279.32 67.2 279.032 65.44 279.032 63.52C279.032 60.448 279.928 57.76 281.72 55.456C283.512 53.152 285.88 51.36 288.824 50.08C291.832 48.8 295.096 48.16 298.616 48.16C301.24 48.16 303.768 48.48 306.2 49.12C308.696 49.76 311 50.688 313.112 51.904C315.288 53.056 317.176 54.432 318.776 56.032L311.48 64.192C310.328 63.04 309.016 62.048 307.544 61.216C306.072 60.32 304.6 59.616 303.128 59.104C301.656 58.528 300.312 58.24 299.096 58.24C298.008 58.24 297.016 58.336 296.12 58.528C295.288 58.72 294.584 59.04 294.008 59.488C293.432 59.872 292.984 60.352 292.664 60.928C292.408 61.504 292.28 62.144 292.28 62.848C292.28 63.552 292.44 64.224 292.76 64.864C293.144 65.44 293.656 65.984 294.296 66.496C294.936 66.88 295.96 67.328 297.368 67.84C298.84 68.352 300.728 68.928 303.032 69.568C306.104 70.4 308.696 71.328 310.808 72.352C312.92 73.376 314.616 74.56 315.896 75.904C317.048 77.056 317.848 78.4 318.296 79.936C318.808 81.408 319.064 83.008 319.064 84.736C319.064 87.872 318.168 90.688 316.376 93.184C314.648 95.616 312.248 97.536 309.176 98.944C306.168 100.288 302.744 100.96 298.904 100.96ZM328.879 121.12V49.216H342.031L342.511 60.544L340.015 59.68C340.399 57.696 341.455 55.84 343.183 54.112C344.975 52.384 347.183 50.976 349.807 49.888C352.431 48.8 355.183 48.256 358.063 48.256C362.479 48.256 366.383 49.376 369.775 51.616C373.231 53.856 375.951 56.96 377.935 60.928C379.919 64.896 380.911 69.472 380.911 74.656C380.911 79.648 379.919 84.128 377.935 88.096C375.951 92.064 373.231 95.2 369.775 97.504C366.319 99.744 362.415 100.864 358.063 100.864C355.119 100.864 352.303 100.288 349.615 99.136C346.991 97.984 344.751 96.512 342.895 94.72C341.039 92.928 339.887 90.976 339.439 88.864L342.607 87.52V121.12H328.879ZM354.991 89.152C357.551 89.152 359.759 88.544 361.615 87.328C363.535 86.112 365.007 84.416 366.031 82.24C367.119 80 367.663 77.472 367.663 74.656C367.663 71.776 367.119 69.248 366.031 67.072C365.007 64.832 363.535 63.104 361.615 61.888C359.759 60.672 357.551 60.064 354.991 60.064C352.431 60.064 350.191 60.672 348.271 61.888C346.351 63.104 344.847 64.8 343.759 66.976C342.671 69.152 342.127 71.712 342.127 74.656C342.127 77.472 342.671 80 343.759 82.24C344.847 84.416 346.351 86.112 348.271 87.328C350.191 88.544 352.431 89.152 354.991 89.152ZM414.742 100.96C409.558 100.96 404.95 99.84 400.918 97.6C396.886 95.296 393.686 92.16 391.318 88.192C389.014 84.224 387.862 79.712 387.862 74.656C387.862 69.536 389.014 64.992 391.318 61.024C393.686 56.992 396.886 53.856 400.918 51.616C404.95 49.312 409.558 48.16 414.742 48.16C419.926 48.16 424.534 49.312 428.566 51.616C432.598 53.856 435.766 56.992 438.07 61.024C440.438 64.992 441.622 69.536 441.622 74.656C441.622 79.712 440.438 84.224 438.07 88.192C435.766 92.16 432.598 95.296 428.566 97.6C424.534 99.84 419.926 100.96 414.742 100.96ZM414.742 89.152C417.238 89.152 419.478 88.512 421.462 87.232C423.446 85.952 424.982 84.224 426.07 82.048C427.222 79.872 427.766 77.408 427.702 74.656C427.766 71.776 427.222 69.248 426.07 67.072C424.982 64.832 423.446 63.104 421.462 61.888C419.478 60.608 417.238 59.968 414.742 59.968C412.246 59.968 409.974 60.608 407.926 61.888C405.942 63.168 404.374 64.896 403.222 67.072C402.134 69.248 401.622 71.776 401.686 74.656C401.622 77.408 402.134 79.872 403.222 82.048C404.374 84.224 405.942 85.952 407.926 87.232C409.974 88.512 412.246 89.152 414.742 89.152ZM451.879 100V49.216H465.031L465.415 59.584L462.727 60.736C463.367 58.432 464.615 56.352 466.471 54.496C468.327 52.576 470.535 51.04 473.095 49.888C475.655 48.736 478.311 48.16 481.063 48.16C484.903 48.16 488.103 48.928 490.663 50.464C493.287 52 495.239 54.336 496.519 57.472C497.863 60.544 498.535 64.384 498.535 68.992V100H484.903V69.952C484.903 67.648 484.583 65.728 483.943 64.192C483.303 62.656 482.343 61.536 481.063 60.832C479.783 60.128 478.151 59.808 476.167 59.872C474.631 59.872 473.223 60.128 471.943 60.64C470.663 61.088 469.511 61.76 468.487 62.656C467.527 63.552 466.791 64.576 466.279 65.728C465.767 66.88 465.511 68.16 465.511 69.568V100H458.695C457.287 100 456.007 100 454.855 100C453.703 100 452.711 100 451.879 100ZM531.565 100.96C527.149 100.96 523.149 99.84 519.565 97.6C516.045 95.36 513.261 92.256 511.213 88.288C509.229 84.256 508.237 79.712 508.237 74.656C508.237 69.536 509.229 64.992 511.213 61.024C513.261 57.056 516.045 53.92 519.565 51.616C523.085 49.312 527.085 48.16 531.565 48.16C533.933 48.16 536.205 48.544 538.381 49.312C540.621 50.016 542.605 51.008 544.333 52.288C546.061 53.568 547.469 55.008 548.557 56.608C549.645 58.144 550.285 59.744 550.477 61.408L547.021 62.08V28.96H560.557V100H547.693L547.117 88.288L549.805 88.672C549.741 90.208 549.197 91.712 548.173 93.184C547.149 94.656 545.773 96 544.045 97.216C542.381 98.368 540.461 99.296 538.285 100C536.173 100.64 533.933 100.96 531.565 100.96ZM534.541 89.632C537.165 89.632 539.405 88.992 541.261 87.712C543.181 86.432 544.685 84.672 545.773 82.432C546.861 80.192 547.405 77.6 547.405 74.656C547.405 71.648 546.861 69.024 545.773 66.784C544.685 64.48 543.181 62.72 541.261 61.504C539.405 60.224 537.165 59.584 534.541 59.584C532.045 59.584 529.837 60.224 527.917 61.504C525.997 62.72 524.493 64.48 523.405 66.784C522.381 69.024 521.869 71.648 521.869 74.656C521.869 77.6 522.381 80.192 523.405 82.432C524.493 84.672 525.997 86.432 527.917 87.712C529.837 88.992 532.045 89.632 534.541 89.632ZM573.754 100V49.216H586.906L587.386 65.536L585.082 62.08C585.914 59.52 587.162 57.184 588.826 55.072C590.554 52.96 592.57 51.296 594.874 50.08C597.242 48.8 599.706 48.16 602.266 48.16C603.418 48.16 604.474 48.256 605.434 48.448C606.458 48.576 607.322 48.8 608.026 49.12L604.378 64C603.674 63.68 602.746 63.392 601.594 63.136C600.506 62.816 599.386 62.656 598.234 62.656C596.762 62.656 595.354 62.944 594.01 63.52C592.73 64.032 591.578 64.8 590.554 65.824C589.594 66.784 588.826 67.936 588.25 69.28C587.738 70.624 587.482 72.128 587.482 73.792V100H573.754Z" fill="black"/>
                    <path d="M609.871 101.056C607.439 101.056 605.551 100.352 604.207 98.944C602.863 97.536 602.191 95.52 602.191 92.896C602.191 90.464 602.895 88.48 604.303 86.944C605.711 85.408 607.567 84.64 609.871 84.64C612.367 84.64 614.287 85.376 615.631 86.848C616.975 88.256 617.647 90.272 617.647 92.896C617.647 95.328 616.911 97.312 615.439 98.848C614.031 100.32 612.175 101.056 609.871 101.056Z" fill="#FF4136"/>
                    <path d="M23.5219 100V88.2353H32.9307L44.5447 49.5588C45.3287 47.0098 46.7753 44.9765 48.8845 43.4588C50.9936 41.9412 53.3203 41.1804 55.8646 41.1765H73.5061C76.0543 41.1765 78.3829 41.9373 80.4921 43.4588C82.6012 44.9804 84.0458 47.0137 84.826 49.5588L96.4399 88.2353H105.849V100H23.5219ZM45.2797 88.2353H84.0909L73.5061 52.9412H55.8646L45.2797 88.2353ZM58.8048 29.4118V0H70.5658V29.4118H58.8048ZM93.7937 43.9706L85.414 35.5882L106.29 14.8529L114.522 23.0882L93.7937 43.9706ZM99.9682 70.5882V58.8235H129.371V70.5882H99.9682ZM35.5769 43.9706L14.8482 23.0882L23.0809 14.8529L43.9566 35.5882L35.5769 43.9706ZM0 70.5882V58.8235H29.4024V70.5882H0Z" fill="#FF4136"/>
                  </svg>
                  <p style="font-size: 8pt; color: #666; margin-top: 5px;">Emergency Dispatch System</p>
                </div>
                <div class="report-info">
                  <h1>Assignment History Report</h1>
                  <p><strong>Generated:</strong> ${new Date().toLocaleString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}</p>
                  <p><strong>Date Range:</strong> ${
                    !filters.dateFrom && !filters.dateTo
                      ? "All Time"
                      : `${
                          filters.dateFrom
                            ? new Date(filters.dateFrom).toLocaleDateString()
                            : "All Time"
                        }${
                          filters.dateTo
                            ? " - " +
                              new Date(filters.dateTo).toLocaleDateString()
                            : ""
                        }`
                  }</p>
                  <p><strong>Total Records:</strong> ${assignments.length}</p>
                </div>
              </div>

              <!-- Executive Summary -->
              <div class="summary-section">
                <h2 class="summary-title">Executive Summary</h2>
                <div class="summary-grid">
                  <div class="summary-card">
                    <div class="summary-value">${totalAssignments}</div>
                    <div class="summary-label">Total Assignments</div>
                  </div>
                  <div class="summary-card">
                    <div class="summary-value">${completedCount}</div>
                    <div class="summary-label">Completed</div>
                  </div>
                  <div class="summary-card">
                    <div class="summary-value">${cancelledCount}</div>
                    <div class="summary-label">Cancelled</div>
                  </div>
                  <div class="summary-card">
                    <div class="summary-value">${declinedCount}</div>
                    <div class="summary-label">Declined</div>
                  </div>
                  <div class="summary-card">
                    <div class="summary-value">${completionRate}%</div>
                    <div class="summary-label">Completion Rate</div>
                  </div>
                </div>

                <h3 style="font-size: 11pt; font-weight: 600; color: #374151; margin: 15px 0 10px 0;">Performance Metrics</h3>
                <div class="metrics-grid">
                  <div class="metric-item">
                    <div class="metric-label">Average Response Time</div>
                    <div class="metric-value">${formatTime(
                      avgResponseTime
                    )}</div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-label">Average Arrival Time</div>
                    <div class="metric-value">${formatTime(
                      avgArrivalTime
                    )}</div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-label">Average On-Scene Time</div>
                    <div class="metric-value">${formatTime(
                      avgOnSceneTime
                    )}</div>
                  </div>
                </div>
              </div>

              <!-- Assignment Details Table -->
              <div class="summary-section">
                <h2 class="summary-title">Assignment Details</h2>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="width: 12%;">Assignment ID</th>
                      <th style="width: 12%;">Incident ID</th>
                      <th style="width: 10%;">Type</th>
                      <th style="width: 12%;">Vehicle</th>
                      <th style="width: 15%;">Crew Leader</th>
                      <th style="width: 10%;">Status</th>
                      <th style="width: 9%;">Priority</th>
                      <th style="width: 10%;">Response</th>
                      <th style="width: 10%;">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${assignments
                      .map((a, index) => {
                        const status =
                          a.response?.status || a.status || "unknown";
                        const priority =
                          a.dispatch?.priority ||
                          a.incident?.incidentId?.severity ||
                          "medium";
                        const responseTime = a.performance?.responseTime;
                        const crewLeader = a.resource?.primaryCrewId?.personal
                          ? `${a.resource.primaryCrewId.personal.firstName} ${a.resource.primaryCrewId.personal.lastName}`
                          : "Unassigned";

                        return `
                    <tr>
                      <td style="font-weight: 600; color: #1e40af;">${
                        a.assignmentId || "-"
                      }</td>
                      <td>${a.incident?.incidentId?.incidentId || "-"}</td>
                      <td style="text-transform: capitalize;">${
                        a.incident?.incidentId?.incidentType || "-"
                      }</td>
                      <td>${
                        a.resource?.vehicleId?.registration?.plateNumber || "-"
                      }</td>
                      <td>${crewLeader}</td>
                      <td><span class="status-badge status-${status}">${status}</span></td>
                      <td><span class="priority-badge priority-${priority}">${priority}</span></td>
                      <td>${responseTime ? formatTime(responseTime) : "-"}</td>
                      <td style="font-size: 8pt;">${
                        a.dispatch?.assignedAt
                          ? new Date(a.dispatch.assignedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "-"
                      }</td>
                    </tr>
                        `;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>

              <!-- Footer -->
              <div class="report-footer">
                <div>
                  <strong>Respondr Emergency Dispatch System</strong>
                </div>
                <div style="text-align: right;">
                  Page 1 of 1
                </div>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

            {/* Completion Rate Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Completion Rate
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    {statistics.totalAssignments > 0
                      ? Math.round(
                          (((statistics?.byStatus?.completed || 0) +
                            (statistics?.byStatus?.returned || 0)) /
                            statistics.totalAssignments) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <MdCheckCircle className="text-3xl text-purple-600" />
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
