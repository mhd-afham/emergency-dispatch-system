import React, { useState, useEffect } from "react";

interface VehiclePendingApproval {
  _id: string;
  registration: {
    plateNumber: string;
    vehicleType: string;
    make: string;
    model: string;
    year: number;
    registrationDate: string;
  };
  station: {
    homeStationId: string;
  };
  equipment: {
    items: Array<{
      name: string;
      type: string;
      quantity: number;
    }>;
  };
  audit: {
    createdBy: {
      _id: string;
      personal: {
        firstName: string;
        lastName: string;
      };
    };
    createdAt: string;
  };
}

interface CrewPendingApproval {
  _id: string;
  personal: {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  professional: {
    role: string;
    certificationLevel: string;
    hireDate: string;
    certifications: Array<{
      type: string;
      number: string;
      expiryDate: string;
    }>;
    specializations: string[];
  };
  settings: {
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  audit: {
    createdBy: {
      _id: string;
      personal: {
        firstName: string;
        lastName: string;
      };
    };
    createdAt: string;
  };
}

const SupervisorPendingApprovals: React.FC = () => {
  // Main tab state: vehicle, crew, or rejected
  const [activeTab, setActiveTab] = useState<"vehicle" | "crew" | "rejected">("vehicle");
  
  // Sub-tab state inside rejected tab
  const [rejectedSubTab, setRejectedSubTab] = useState<"vehicle" | "crew">("vehicle");
  
  // Pending approvals data
  const [vehicleApprovals, setVehicleApprovals] = useState<VehiclePendingApproval[]>([]);
  const [crewApprovals, setCrewApprovals] = useState<CrewPendingApproval[]>([]);
  
  // Rejected requests data
  const [rejectedVehicles, setRejectedVehicles] = useState<any[]>([]);
  const [rejectedCrew, setRejectedCrew] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: "vehicle" | "crew" } | null>(null);

  // Debug logging
  console.log('SupervisorPendingApprovals - Mounted');

  // Fetch pending vehicle approvals
  const fetchVehicleApprovals = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      
      console.log("🔍 Fetching pending approvals from:", `${apiUrl}/api/vehicles/pending-approval`);
      console.log("🔑 Token exists:", !!token);

      const response = await fetch(
        `${apiUrl}/api/vehicles/pending-approval`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📡 Response status:", response.status, response.statusText);

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (response.ok) {
        // Handle different response formats
        if (Array.isArray(data)) {
          console.log("✅ Format: Direct array", data.length, "items");
          setVehicleApprovals(data);
        } else if (data.data && data.data.pendingVehicles && Array.isArray(data.data.pendingVehicles)) {
          // Backend returns: { success: true, data: { pendingVehicles: [...] } }
          console.log("✅ Format: data.pendingVehicles", data.data.pendingVehicles.length, "items");
          setVehicleApprovals(data.data.pendingVehicles);
        } else if (data.data && Array.isArray(data.data)) {
          console.log("✅ Format: data.data array", data.data.length, "items");
          setVehicleApprovals(data.data);
        } else {
          console.warn("⚠️ Unexpected response format:", data);
          setVehicleApprovals([]);
        }
      } else {
        console.error("❌ Response not OK:", response.status, data);
        throw new Error(data.message || "Failed to fetch vehicle approvals");
      }
    } catch (error) {
      console.error("❌ Error fetching vehicle approvals:", error);
      setError(error instanceof Error ? error.message : "Failed to load vehicle approvals");
      setVehicleApprovals([]); // Ensure it's always an array even on error
    }
  };

  // Fetch pending crew approvals
  const fetchCrewApprovals = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      
      console.log("🔍 Fetching pending crew approvals from:", `${apiUrl}/api/crew/pending-approval`);
      console.log("🔑 Token exists:", !!token);

      const response = await fetch(
        `${apiUrl}/api/crew/pending-approval`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📡 Crew response status:", response.status, response.statusText);

      const data = await response.json();
      console.log("📦 Crew response data:", data);

      if (response.ok) {
        // Handle different response formats
        if (Array.isArray(data)) {
          console.log("✅ Format: Direct array", data.length, "crew");
          setCrewApprovals(data);
        } else if (data.data && data.data.pendingCrew && Array.isArray(data.data.pendingCrew)) {
          // Backend returns: { success: true, data: { pendingCrew: [...] } }
          console.log("✅ Format: data.pendingCrew", data.data.pendingCrew.length, "crew");
          setCrewApprovals(data.data.pendingCrew);
        } else if (data.data && Array.isArray(data.data)) {
          console.log("✅ Format: data.data array", data.data.length, "crew");
          setCrewApprovals(data.data);
        } else {
          console.warn("⚠️ Unexpected crew response format:", data);
          setCrewApprovals([]);
        }
      } else {
        console.error("❌ Crew response not OK:", response.status, data);
        throw new Error(data.message || "Failed to fetch crew approvals");
      }
    } catch (error) {
      console.error("❌ Error fetching crew approvals:", error);
      // Don't set main error, just log it and set empty array
      console.warn("Crew approval fetch failed, setting empty array");
      setCrewApprovals([]);
    }
  };

  // Fetch rejected vehicles
  const fetchRejectedVehicles = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `${apiUrl}/api/vehicles/rejected`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.data && data.data.rejectedVehicles && Array.isArray(data.data.rejectedVehicles)) {
          setRejectedVehicles(data.data.rejectedVehicles);
        } else if (data.data && Array.isArray(data.data)) {
          setRejectedVehicles(data.data);
        } else {
          setRejectedVehicles([]);
        }
      } else {
        throw new Error(data.message || "Failed to fetch rejected vehicles");
      }
    } catch (error) {
      console.error("Error fetching rejected vehicles:", error);
      setRejectedVehicles([]);
    }
  };

  // Fetch rejected crew
  const fetchRejectedCrew = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `${apiUrl}/api/crew/rejected`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.data && data.data.rejectedCrew && Array.isArray(data.data.rejectedCrew)) {
          setRejectedCrew(data.data.rejectedCrew);
        } else if (data.data && Array.isArray(data.data)) {
          setRejectedCrew(data.data);
        } else {
          setRejectedCrew([]);
        }
      } else {
        throw new Error(data.message || "Failed to fetch rejected crew");
      }
    } catch (error) {
      console.error("Error fetching rejected crew:", error);
      setRejectedCrew([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError("");
      if (activeTab === "rejected") {
        // Load rejected data when on rejected tab
        await Promise.all([fetchRejectedVehicles(), fetchRejectedCrew()]);
      } else {
        // Load pending data when on vehicle or crew tabs
        await Promise.all([fetchVehicleApprovals(), fetchCrewApprovals()]);
      }
      setIsLoading(false);
    };

    loadData();
  }, [activeTab]);

  const handleApprove = async (id: string, type: "vehicle" | "crew") => {
    setProcessingId(id);
    setError("");
    setSuccessMessage("");

    try {
      const endpoint = type === "vehicle" ? `/vehicles/${id}/approve` : `/crew/${id}/approve`;
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(
          `${type === "vehicle" ? "Vehicle" : "Crew member"} approved successfully! It is now available for dispatch.`
        );
        
        // Refresh the lists
        if (type === "vehicle") {
          await fetchVehicleApprovals();
        } else {
          await fetchCrewApprovals();
        }

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        throw new Error(data.message || "Failed to approve");
      }
    } catch (error) {
      console.error(`Error approving ${type}:`, error);
      setError(error instanceof Error ? error.message : `Failed to approve ${type}`);
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (id: string, type: "vehicle" | "crew") => {
    setRejectTarget({ id, type });
    setRejectReason("");
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectTarget(null);
    setRejectReason("");
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setProcessingId(rejectTarget.id);
    setError("");
    setSuccessMessage("");

    try {
      const endpoint = rejectTarget.type === "vehicle" 
        ? `/vehicles/${rejectTarget.id}/reject` 
        : `/crew/${rejectTarget.id}/reject`;
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(
          `${rejectTarget.type === "vehicle" ? "Vehicle" : "Crew"} registration rejected. Admin has been notified.`
        );
        
        // Refresh the lists
        if (rejectTarget.type === "vehicle") {
          await fetchVehicleApprovals();
        } else {
          await fetchCrewApprovals();
        }

        closeRejectModal();

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        throw new Error(data.message || "Failed to reject");
      }
    } catch (error) {
      console.error(`Error rejecting ${rejectTarget.type}:`, error);
      setError(error instanceof Error ? error.message : `Failed to reject ${rejectTarget.type}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle delete for rejected requests
  const handleDeleteRejected = async (id: string, type: "vehicle" | "crew") => {
    if (!window.confirm(`Are you sure you want to permanently delete this rejected ${type} registration?`)) {
      return;
    }

    setProcessingId(id);
    setError("");
    setSuccessMessage("");

    try {
      const endpoint = type === "vehicle" ? `/vehicles/${id}` : `/crew/${id}`;
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}${endpoint}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(
          `Rejected ${type === "vehicle" ? "vehicle" : "crew member"} registration deleted successfully.`
        );
        
        // Refresh the lists
        if (type === "vehicle") {
          await fetchRejectedVehicles();
        } else {
          await fetchRejectedCrew();
        }

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        throw new Error(data.message || "Failed to delete");
      }
    } catch (error) {
      console.error(`Error deleting rejected ${type}:`, error);
      setError(error instanceof Error ? error.message : `Failed to delete rejected ${type}`);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900">Pending Approvals</h2>
        <p className="text-sm text-gray-600 mt-1">
          Review and approve/reject registration requests
        </p>
        
        {/* Tab Selection - All three tabs parallel */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {/* Vehicle Registration Requests Tab */}
            <button
              onClick={() => setActiveTab("vehicle")}
              className={`${
                activeTab === "vehicle"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8z" />
              </svg>
              Vehicle Registration Requests
              {vehicleApprovals.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {vehicleApprovals.length}
                </span>
              )}
            </button>

            {/* Crew Registration Requests Tab */}
            <button
              onClick={() => setActiveTab("crew")}
              className={`${
                activeTab === "crew"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Crew Registration Requests
              {crewApprovals.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {crewApprovals.length}
                </span>
              )}
            </button>

            {/* Rejected Requests Tab */}
            <button
              onClick={() => setActiveTab("rejected")}
              className={`${
                activeTab === "rejected"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rejected Requests
              {(rejectedVehicles.length + rejectedCrew.length) > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  {rejectedVehicles.length + rejectedCrew.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Sub-Tabs inside Rejected Requests - Only show when Rejected is active */}
        {activeTab === "rejected" && (
          <div className="mt-4 border-b border-gray-200 bg-red-50 px-4 py-2 rounded-t-lg">
            <nav className="-mb-px flex space-x-8" aria-label="Rejected Sub Tabs">
              <button
                onClick={() => setRejectedSubTab("vehicle")}
                className={`${
                  rejectedSubTab === "vehicle"
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8z" />
                </svg>
                Vehicle Requests
                {rejectedVehicles.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    {rejectedVehicles.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setRejectedSubTab("crew")}
                className={`${
                  rejectedSubTab === "crew"
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Crew Requests
                {rejectedCrew.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    {rejectedCrew.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Vehicle Registration Content - Pending */}
      {activeTab === "vehicle" && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">
                  Vehicle Registration Requests
                </h3>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {vehicleApprovals.length} Pending
              </span>
            </div>
          </div>

        <div className="p-6">
          {!Array.isArray(vehicleApprovals) || vehicleApprovals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2">No pending vehicle registration requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicleApprovals.map((vehicle) => (
                <div key={vehicle._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Vehicle Header */}
                      <div className="flex items-center mb-3">
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {vehicle.registration.vehicleType}
                        </div>
                        <h4 className="ml-3 text-lg font-semibold text-gray-900">
                          {vehicle.registration.plateNumber}
                        </h4>
                      </div>

                      {/* Vehicle Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Make & Model</p>
                          <p className="text-sm font-medium text-gray-900">
                            {vehicle.registration.make} {vehicle.registration.model} ({vehicle.registration.year})
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Equipment Items</p>
                          <p className="text-sm font-medium text-gray-900">
                            {vehicle.equipment?.items?.length || 0} items registered
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Requested By</p>
                          <p className="text-sm font-medium text-gray-900">
                            {vehicle.audit.createdBy.personal.firstName} {vehicle.audit.createdBy.personal.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Requested On</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(vehicle.audit.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Equipment Summary */}
                      {vehicle.equipment?.items && vehicle.equipment.items.length > 0 && (
                        <div className="bg-gray-50 rounded-md p-3 mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">Equipment Summary:</p>
                          <div className="flex flex-wrap gap-2">
                            {vehicle.equipment.items.slice(0, 5).map((item, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-white border border-gray-200">
                                {item.name} (×{item.quantity})
                              </span>
                            ))}
                            {vehicle.equipment.items.length > 5 && (
                              <span className="text-xs text-gray-500">
                                +{vehicle.equipment.items.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => handleApprove(vehicle._id, "vehicle")}
                        disabled={processingId === vehicle._id}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                      >
                        {processingId === vehicle._id ? "Processing..." : "✓ Approve"}
                      </button>
                      <button
                        onClick={() => openRejectModal(vehicle._id, "vehicle")}
                        disabled={processingId === vehicle._id}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Crew Registration Content - Pending */}
      {activeTab === "crew" && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">
                  Crew Registration Requests
                </h3>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {crewApprovals.length} Pending
              </span>
            </div>
          </div>

        <div className="p-6">
          {!Array.isArray(crewApprovals) || crewApprovals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-2">No pending crew registration requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {crewApprovals.map((crew) => (
                <div key={crew._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Crew Header */}
                      <div className="flex items-center mb-3">
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {crew.professional.role}
                        </div>
                        <h4 className="ml-3 text-lg font-semibold text-gray-900">
                          {crew.personal.firstName} {crew.personal.lastName}
                        </h4>
                      </div>

                      {/* Crew Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Employee ID</p>
                          <p className="text-sm font-medium text-gray-900">{crew.personal.employeeId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Certification Level</p>
                          <p className="text-sm font-medium text-gray-900">{crew.professional.certificationLevel}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="text-sm font-medium text-gray-900">{crew.personal.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="text-sm font-medium text-gray-900">{crew.personal.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Requested By</p>
                          <p className="text-sm font-medium text-gray-900">
                            {crew.audit.createdBy.personal.firstName} {crew.audit.createdBy.personal.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Requested On</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(crew.audit.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Certifications & Specializations */}
                      <div className="bg-gray-50 rounded-md p-3 mb-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Certifications: {crew.professional.certifications?.length || 0} |
                          Specializations: {crew.professional.specializations?.length || 0}
                        </p>
                        {crew.professional.specializations && crew.professional.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {crew.professional.specializations.map((spec, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-white border border-gray-200">
                                {spec.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => handleApprove(crew._id, "crew")}
                        disabled={processingId === crew._id}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                      >
                        {processingId === crew._id ? "Processing..." : "✓ Approve"}
                      </button>
                      <button
                        onClick={() => openRejectModal(crew._id, "crew")}
                        disabled={processingId === crew._id}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Rejected Requests Tab Content - Vehicle */}
      {activeTab === "rejected" && rejectedSubTab === "vehicle" && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">
                  Rejected Vehicle Registrations
                </h3>
              </div>
              <span className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-full">
                {rejectedVehicles.length} Rejected
              </span>
            </div>
          </div>

        <div className="p-6">
          {rejectedVehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2">No rejected vehicle registrations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rejectedVehicles.map((vehicle) => (
                <div key={vehicle._id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Vehicle Header */}
                      <div className="flex items-center mb-3">
                        <div className="bg-red-200 text-red-900 px-3 py-1 rounded-full text-sm font-medium">
                          {vehicle.registration.vehicleType}
                        </div>
                        <h4 className="ml-3 text-lg font-semibold text-gray-900">
                          {vehicle.registration.plateNumber}
                        </h4>
                        <span className="ml-2 text-red-600 text-sm font-medium">❌ REJECTED</span>
                      </div>

                      {/* Vehicle Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Make & Model</p>
                          <p className="text-sm font-medium text-gray-900">
                            {vehicle.registration.make} {vehicle.registration.model} ({vehicle.registration.year})
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Registration Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(vehicle.registration.registrationDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">VIN</p>
                          <p className="text-sm font-medium text-gray-900">
                            {vehicle.registration.vin}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="text-sm font-medium text-gray-900">
                            {vehicle.status.operational}
                          </p>
                        </div>
                      </div>

                      {/* Rejection Details */}
                      {vehicle.rejectionDetails && (
                        <div className="bg-red-100 border border-red-300 rounded-md p-3 mb-4">
                          <p className="text-sm font-medium text-red-900 mb-1">Rejection Details:</p>
                          <p className="text-sm text-red-800 mb-2"><strong>Reason:</strong> {vehicle.rejectionDetails.reason}</p>
                          <p className="text-sm text-red-700">
                            <strong>Rejected by:</strong> {vehicle.rejectionDetails.rejectedBy?.personal?.firstName} {vehicle.rejectionDetails.rejectedBy?.personal?.lastName} on {formatDate(vehicle.rejectionDetails.rejectedAt)}
                          </p>
                        </div>
                      )}

                      {/* Equipment */}
                      {vehicle.equipment?.items && vehicle.equipment.items.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Equipment:</p>
                          <div className="flex flex-wrap gap-2">
                            {vehicle.equipment.items.map((item: any, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {item.name} ({item.quantity})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Registration Info */}
                      <div className="text-xs text-gray-500 mt-2">
                        Originally submitted by {vehicle.audit?.createdBy?.personal?.firstName} {vehicle.audit?.createdBy?.personal?.lastName} on {formatDate(vehicle.audit?.createdAt)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => alert(`View details for vehicle ${vehicle.registration.plateNumber}`)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 min-w-[100px]"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleDeleteRejected(vehicle._id, "vehicle")}
                        disabled={processingId === vehicle._id}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Rejected Requests Tab Content - Crew */}
      {activeTab === "rejected" && rejectedSubTab === "crew" && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">
                  Rejected Crew Registrations
                </h3>
              </div>
              <span className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-full">
                {rejectedCrew.length} Rejected
              </span>
            </div>
          </div>

        <div className="p-6">
          {rejectedCrew.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2">No rejected crew registrations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rejectedCrew.map((crew) => (
                <div key={crew._id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Crew Header */}
                      <div className="flex items-center mb-3">
                        <div className="bg-red-200 text-red-900 px-3 py-1 rounded-full text-sm font-medium">
                          {crew.professional.role}
                        </div>
                        <h4 className="ml-3 text-lg font-semibold text-gray-900">
                          {crew.personal.firstName} {crew.personal.lastName}
                        </h4>
                        <span className="ml-2 text-red-600 text-sm font-medium">❌ REJECTED</span>
                      </div>

                      {/* Crew Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Employee ID</p>
                          <p className="text-sm font-medium text-gray-900">
                            {crew.personal.employeeId}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Contact</p>
                          <p className="text-sm font-medium text-gray-900">
                            {crew.personal.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Certification Level</p>
                          <p className="text-sm font-medium text-gray-900">
                            {crew.professional.certificationLevel}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Hire Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(crew.professional.hireDate)}
                          </p>
                        </div>
                      </div>

                      {/* Rejection Details */}
                      {crew.rejectionDetails && (
                        <div className="bg-red-100 border border-red-300 rounded-md p-3 mb-4">
                          <p className="text-sm font-medium text-red-900 mb-1">Rejection Details:</p>
                          <p className="text-sm text-red-800 mb-2"><strong>Reason:</strong> {crew.rejectionDetails.reason}</p>
                          <p className="text-sm text-red-700">
                            <strong>Rejected by:</strong> {crew.rejectionDetails.rejectedBy?.personal?.firstName} {crew.rejectionDetails.rejectedBy?.personal?.lastName} on {formatDate(crew.rejectionDetails.rejectedAt)}
                          </p>
                        </div>
                      )}

                      {/* Certifications & Specializations */}
                      {crew.professional.specializations && crew.professional.specializations.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Specializations:</p>
                          <div className="flex flex-wrap gap-2">
                            {crew.professional.specializations.map((spec: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {spec.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Emergency Contact */}
                      {crew.settings?.emergencyContact && (
                        <div className="text-xs text-gray-600 mb-2">
                          <strong>Emergency Contact:</strong> {crew.settings.emergencyContact.name} ({crew.settings.emergencyContact.relationship}) - {crew.settings.emergencyContact.phone}
                        </div>
                      )}

                      {/* Registration Info */}
                      <div className="text-xs text-gray-500 mt-2">
                        Originally submitted by {crew.audit?.createdBy?.personal?.firstName} {crew.audit?.createdBy?.personal?.lastName} on {formatDate(crew.audit?.createdAt)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => alert(`View details for ${crew.personal.firstName} ${crew.personal.lastName}`)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 min-w-[100px]"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleDeleteRejected(crew._id, "crew")}
                        disabled={processingId === crew._id}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Reject Registration
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  Please provide a reason for rejecting this registration. The admin will be notified.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                  placeholder="Enter rejection reason..."
                />
              </div>
              <div className="flex justify-end space-x-3 px-4 py-3">
                <button
                  onClick={closeRejectModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || processingId !== null}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorPendingApprovals;