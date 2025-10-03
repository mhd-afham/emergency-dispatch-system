import React, { useState, useEffect } from "react";
import VehicleRegistrationWizard from "./VehicleRegistrationWizard";
import CrewRegistrationWizard from "./CrewRegistrationWizard";
import axios from 'axios';

type RegistrationMode = "overview" | "vehicle" | "crew";
type FormsSection = "approved" | "rejected" | "drafted" | null;
type FormType = "vehicle" | "crew";

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Admin Registration Section
 * 
 * Shows registration options and three inline sections for viewing forms:
 * - Approved Forms
 * - Rejected Forms  
 * - Saved and Drafted Forms
 */
const AdminRegistrationSection: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<RegistrationMode>("overview");
  const [expandedSection, setExpandedSection] = useState<FormsSection>(null);
  const [selectedFormType, setSelectedFormType] = useState<FormType>("vehicle");
  
  // Data states
  const [approvedVehicles, setApprovedVehicles] = useState<any[]>([]);
  const [approvedCrew, setApprovedCrew] = useState<any[]>([]);
  const [rejectedVehicles, setRejectedVehicles] = useState<any[]>([]);
  const [rejectedCrew, setRejectedCrew] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when a section is expanded
  useEffect(() => {
    if (expandedSection) {
      fetchData();
    }
  }, [expandedSection, selectedFormType]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (expandedSection === 'approved') {
        if (selectedFormType === 'vehicle') {
          const response = await apiClient.get('/vehicles/approved');
          setApprovedVehicles(response.data.data.approvedVehicles || []);
        } else {
          const response = await apiClient.get('/crew/approved');
          setApprovedCrew(response.data.data.approvedCrew || []);
        }
      } else if (expandedSection === 'rejected') {
        if (selectedFormType === 'vehicle') {
          const response = await apiClient.get('/vehicles/rejected');
          setRejectedVehicles(response.data.data.rejectedVehicles || []);
        } else {
          const response = await apiClient.get('/crew/rejected');
          setRejectedCrew(response.data.data.rejectedCrew || []);
        }
      } else if (expandedSection === 'drafted') {
        const response = await apiClient.get(`/drafts?type=${selectedFormType}`);
        setDrafts(response.data.data.drafts || []);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionClick = (section: FormsSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) {
      return;
    }
    try {
      await apiClient.delete(`/drafts/${draftId}`);
      alert('Draft deleted successfully');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting draft:', err);
      alert(err.response?.data?.message || 'Failed to delete draft');
    }
  };

  const handleDeleteRejected = async (id: string, type: FormType) => {
    if (!window.confirm('Are you sure you want to permanently delete this rejected registration?')) {
      return;
    }
    try {
      const endpoint = type === 'vehicle' ? `/vehicles/${id}` : `/crew/${id}`;
      await apiClient.delete(endpoint);
      alert('Rejected registration deleted successfully');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting rejected registration:', err);
      alert(err.response?.data?.message || 'Failed to delete rejected registration');
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSuccess = () => {
    setCurrentMode("overview");
  };

  const handleCancel = () => {
    setCurrentMode("overview");
  };

  // Render specific registration wizard
  if (currentMode === "vehicle") {
    return (
      <VehicleRegistrationWizard
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  if (currentMode === "crew") {
    return (
      <CrewRegistrationWizard
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  // Overview mode - show both registration options
  return (
    <div className="space-y-6">
      {/* Registration Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vehicle Registration */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center">
              <svg
                className="h-6 w-6 text-blue-600 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">
                Vehicle Registration
              </h3>
            </div>
          </div>
          <div className="p-6 flex items-center justify-center min-h-[200px]">
            <button
              onClick={() => setCurrentMode("vehicle")}
              className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Start Registration
            </button>
          </div>
        </div>

        {/* Crew Registration */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
            <div className="flex items-center">
              <svg
                className="h-6 w-6 text-green-600 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">
                Crew Registration
              </h3>
            </div>
          </div>
          <div className="p-6 flex items-center justify-center min-h-[200px]">
            <button
              onClick={() => setCurrentMode("crew")}
              className="bg-green-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Start Registration
            </button>
          </div>
        </div>
      </div>

      {/* Registration Forms Section - Tab Style like Supervisor Pending Approvals */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900">Registration Forms</h2>
        <p className="text-sm text-gray-600 mt-1">
          View all approved, rejected, and saved draft registrations
        </p>
        
        {/* Tab Selection - Horizontal tabs like Supervisor */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {/* Approved Tab */}
            <button
              onClick={() => setExpandedSection('approved')}
              className={`${
                expandedSection === "approved"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Approved Forms
            </button>

            {/* Rejected Tab */}
            <button
              onClick={() => setExpandedSection('rejected')}
              className={`${
                expandedSection === "rejected"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rejected Forms
            </button>

            {/* Drafted Tab */}
            <button
              onClick={() => setExpandedSection('drafted')}
              className={`${
                expandedSection === "drafted"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Saved and Drafted Forms
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content - Only show content for active tab */}
      {expandedSection === 'approved' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Approved Forms</h3>
              </div>
            </div>
          </div>
            
            {expandedSection === 'approved' && (
              <div className="p-6 border-t border-gray-200">
                {/* Type Toggle */}
                <div className="flex gap-4 mb-6">
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                      selectedFormType === 'vehicle'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                    onClick={() => setSelectedFormType('vehicle')}
                  >
                    🚗 Vehicles
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                      selectedFormType === 'crew'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                    onClick={() => setSelectedFormType('crew')}
                  >
                    👥 Crew Members
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    ⚠️ {error}
                  </div>
                ) : (
                  <div>
                    {selectedFormType === 'vehicle' ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-4">Total: {approvedVehicles.length} approved vehicles</p>
                        {approvedVehicles.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No approved vehicles found</p>
                        ) : (
                          <div className="space-y-3">
                            {approvedVehicles.map((vehicle) => (
                              <div key={vehicle._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-gray-900">{vehicle.registration.plateNumber}</h4>
                                    <p className="text-gray-600">{vehicle.registration.vehicleType} - {vehicle.registration.make} {vehicle.registration.model} ({vehicle.registration.year})</p>
                                    <p className="text-sm text-gray-500 mt-1">Station: {vehicle.station.homeStationId.name}</p>
                                    {vehicle.registration.approvedBy && (
                                      <p className="text-sm text-green-600 mt-1">
                                        ✅ Approved by {vehicle.registration.approvedBy.personal.firstName} {vehicle.registration.approvedBy.personal.lastName} on {formatDate(vehicle.registration.approvalDate)}
                                      </p>
                                    )}
                                  </div>
                                  <button className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm">
                                    View Details
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600 mb-4">Total: {approvedCrew.length} approved crew members</p>
                        {approvedCrew.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No approved crew members found</p>
                        ) : (
                          <div className="space-y-3">
                            {approvedCrew.map((crew) => (
                              <div key={crew._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-gray-900">{crew.personal.firstName} {crew.personal.lastName}</h4>
                                    <p className="text-gray-600">{crew.professional.role} - ID: {crew.personal.employeeId}</p>
                                    <p className="text-sm text-gray-500 mt-1">Email: {crew.personal.email}</p>
                                    <p className="text-sm text-gray-500">Station: {crew.professional.homeStation.name}</p>
                                    <p className="text-sm text-green-600 mt-1">✅ Registered on {formatDate(crew.audit.createdAt)}</p>
                                  </div>
                                  <button className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm">
                                    View Details
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {/* Rejected Tab Content */}
      {expandedSection === 'rejected' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Rejected Forms</h3>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Type Toggle */}
            <div className="flex gap-4 mb-6">
              <button
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  selectedFormType === 'vehicle'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => setSelectedFormType('vehicle')}
              >
                🚗 Vehicles
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  selectedFormType === 'crew'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => setSelectedFormType('crew')}
              >
                👥 Crew Members
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                ⚠️ {error}
              </div>
            ) : (
              <div>
                {selectedFormType === 'vehicle' ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">Total: {rejectedVehicles.length} rejected vehicles</p>
                    {rejectedVehicles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2">No rejected vehicles found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rejectedVehicles.map((vehicle) => (
                          <div key={vehicle._id} className="border border-red-200 rounded-lg p-4 bg-red-50 hover:shadow-md transition-shadow duration-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900">{vehicle.registration.plateNumber}</h4>
                                <p className="text-gray-700">{vehicle.registration.vehicleType} - {vehicle.registration.make} {vehicle.registration.model} ({vehicle.registration.year})</p>
                                {vehicle.rejectionDetails && (
                                  <>
                                    <p className="text-sm text-red-700 mt-2 font-medium">
                                      ❌ Rejected by {vehicle.rejectionDetails.rejectedBy.personal.firstName} {vehicle.rejectionDetails.rejectedBy.personal.lastName} on {formatDate(vehicle.rejectionDetails.rejectedAt)}
                                    </p>
                                    <p className="text-sm text-gray-700 mt-1"><strong>Reason:</strong> {vehicle.rejectionDetails.reason}</p>
                                  </>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm">
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteRejected(vehicle._id, 'vehicle')}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">Total: {rejectedCrew.length} rejected crew members</p>
                    {rejectedCrew.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2">No rejected crew members found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rejectedCrew.map((crew) => (
                          <div key={crew._id} className="border border-red-200 rounded-lg p-4 bg-red-50 hover:shadow-md transition-shadow duration-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900">{crew.personal.firstName} {crew.personal.lastName}</h4>
                                <p className="text-gray-700">{crew.professional.role} - ID: {crew.personal.employeeId}</p>
                                {crew.rejectionDetails && (
                                  <>
                                    <p className="text-sm text-red-700 mt-2 font-medium">
                                      ❌ Rejected by {crew.rejectionDetails.rejectedBy.personal.firstName} {crew.rejectionDetails.rejectedBy.personal.lastName} on {formatDate(crew.rejectionDetails.rejectedAt)}
                                    </p>
                                    <p className="text-sm text-gray-700 mt-1"><strong>Reason:</strong> {crew.rejectionDetails.reason}</p>
                                  </>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm">
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteRejected(crew._id, 'crew')}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drafted Tab Content */}
      {expandedSection === 'drafted' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Saved and Drafted Forms</h3>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Type Toggle */}
            <div className="flex gap-4 mb-6">
              <button
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  selectedFormType === 'vehicle'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => setSelectedFormType('vehicle')}
              >
                🚗 Vehicles
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  selectedFormType === 'crew'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => setSelectedFormType('crew')}
              >
                👥 Crew Members
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                ⚠️ {error}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">Total: {drafts.length} saved drafts - {selectedFormType === 'vehicle' ? 'Vehicles' : 'Crew Members'}</p>
                {drafts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2">No drafts found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drafts.map((draft) => (
                      <div key={draft._id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50 hover:shadow-md transition-shadow duration-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{draft.draftTitle}</h4>
                            <p className="text-gray-600">Step {draft.currentStep} of 3 - {draft.completionPercentage}% Complete</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${draft.completionPercentage}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Last updated: {formatDate(draft.audit.updatedAt)}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm">
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(draft._id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrationSection;
