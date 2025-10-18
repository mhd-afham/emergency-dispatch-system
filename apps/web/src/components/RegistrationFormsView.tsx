import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Notification from './common/Notification';

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

interface RegistrationFormsViewProps {
  onClose: () => void;
}

interface Vehicle {
  _id: string;
  registration: {
    plateNumber: string;
    vehicleType: string;
    make: string;
    model: string;
    year: number;
    approvedBy?: {
      personal: {
        firstName: string;
        lastName: string;
      };
    };
    approvalDate?: Date;
  };
  registrationStatus?: {
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: {
      personal: {
        firstName: string;
        lastName: string;
      };
    };
    approvedAt?: Date;
    rejectedBy?: {
      personal: {
        firstName: string;
        lastName: string;
      };
    };
    rejectedAt?: Date;
    rejectionReason?: string;
    notes?: string;
  };
  station: {
    homeStationId: {
      name: string;
    };
  };
}

interface CrewMember {
  _id: string;
  personal: {
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
  };
  professional: {
    role: string;
    homeStation: {
      name: string;
    };
  };
  registrationStatus?: {
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: {
      personal: {
        firstName: string;
        lastName: string;
      };
    };
    approvedAt?: Date;
    rejectedBy?: {
      personal: {
        firstName: string;
        lastName: string;
      };
    };
    rejectedAt?: Date;
    rejectionReason?: string;
    notes?: string;
  };
  audit: {
    createdAt: Date;
  };
}

interface Draft {
  _id: string;
  registrationType: 'vehicle' | 'crew';
  draftTitle: string;
  currentStep: number;
  completionPercentage: number;
  formData: any;
  audit: {
    createdAt: Date;
    updatedAt: Date;
  };
}

const RegistrationFormsView: React.FC<RegistrationFormsViewProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'approved' | 'rejected' | 'drafted'>('approved');
  const [selectedType, setSelectedType] = useState<'vehicle' | 'crew'>('vehicle');

  // States for each data type
  const [approvedVehicles, setApprovedVehicles] = useState<Vehicle[]>([]);
  const [approvedCrew, setApprovedCrew] = useState<CrewMember[]>([]);
  const [rejectedVehicles, setRejectedVehicles] = useState<Vehicle[]>([]);
  const [rejectedCrew, setRejectedCrew] = useState<CrewMember[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  // Fetch data based on active tab and selected type
  useEffect(() => {
    fetchData();
  }, [activeTab, selectedType]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'approved') {
        if (selectedType === 'vehicle') {
          const response = await apiClient.get('/vehicles/approved');
          setApprovedVehicles(response.data.data.approvedVehicles || []);
        } else {
          const response = await apiClient.get('/crew/approved');
          setApprovedCrew(response.data.data.approvedCrew || []);
        }
      } else if (activeTab === 'rejected') {
        if (selectedType === 'vehicle') {
          const response = await apiClient.get('/vehicles/rejected');
          setRejectedVehicles(response.data.data.rejectedVehicles || []);
        } else {
          const response = await apiClient.get('/crew/rejected');
          setRejectedCrew(response.data.data.rejectedCrew || []);
        }
      } else if (activeTab === 'drafted') {
        const response = await apiClient.get(`/drafts?type=${selectedType}`);
        setDrafts(response.data.data.drafts || []);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    // Show confirmation dialog
    setNotification({
      show: true,
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this draft? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/drafts/${draftId}`);
          setNotification({
            show: true,
            type: 'success',
            title: 'Draft Deleted',
            message: 'The draft has been successfully deleted.',
            onConfirm: () => {
              setNotification(null);
              fetchData(); // Refresh the list
            },
          });
        } catch (err: any) {
          console.error('Error deleting draft:', err);
          setNotification({
            show: true,
            type: 'error',
            title: 'Delete Failed',
            message: err.response?.data?.message || 'Failed to delete draft. Please try again.',
          });
        }
      },
    });
  };

  const handleDeleteRejected = async (id: string, type: 'vehicle' | 'crew') => {
    // Show confirmation dialog
    setNotification({
      show: true,
      type: 'warning',
      title: 'Confirm Delete',
      message: `Are you sure you want to permanently delete this rejected ${type} registration? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const endpoint = type === 'vehicle' ? `/vehicles/${id}` : `/crew/${id}`;
          await apiClient.delete(endpoint);
          setNotification({
            show: true,
            type: 'success',
            title: 'Registration Deleted',
            message: `The rejected ${type} registration has been successfully deleted.`,
            onConfirm: () => {
              setNotification(null);
              fetchData(); // Refresh the list
            },
          });
        } catch (err: any) {
          console.error('Error deleting rejected registration:', err);
          setNotification({
            show: true,
            type: 'error',
            title: 'Delete Failed',
            message: err.response?.data?.message || 'Failed to delete rejected registration. Please try again.',
          });
        }
      },
    });
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Notification Modal */}
      {notification && notification.show && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => {
            if (notification.onConfirm) {
              notification.onConfirm();
            } else {
              setNotification(null);
            }
          }}
          onConfirm={notification.onConfirm}
          confirmText={notification.onConfirm ? "Confirm" : "OK"}
          cancelText="Cancel"
        />
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Registration Forms</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors duration-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            className={`flex-1 py-3 px-4 font-semibold transition-all duration-200 ${
              activeTab === 'approved'
                ? 'bg-white text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('approved')}
          >
            ✅ Approved Forms
          </button>
          <button
            className={`flex-1 py-3 px-4 font-semibold transition-all duration-200 ${
              activeTab === 'rejected'
                ? 'bg-white text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('rejected')}
          >
            ❌ Rejected Forms
          </button>
          <button
            className={`flex-1 py-3 px-4 font-semibold transition-all duration-200 ${
              activeTab === 'drafted'
                ? 'bg-white text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('drafted')}
          >
            📝 Saved Drafts
          </button>
        </div>

        {/* Type Toggle (Vehicle / Crew) */}
        <div className="flex gap-4 p-4 bg-gray-50 border-b border-gray-200">
          <button
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              selectedType === 'vehicle'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
            onClick={() => setSelectedType('vehicle')}
          >
            🚗 Vehicles
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              selectedType === 'crew'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
            onClick={() => setSelectedType('crew')}
          >
            👥 Crew Members
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              ⚠️ {error}
            </div>
          ) : (
            <div>
              {/* APPROVED TAB */}
              {activeTab === 'approved' && (
                <div>
                  {selectedType === 'vehicle' ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        Approved Vehicles ({approvedVehicles.length})
                      </h3>
                      {approvedVehicles.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No approved vehicles found</p>
                      ) : (
                        <div className="grid gap-4">
                          {approvedVehicles.map((vehicle) => (
                            <div
                              key={vehicle._id}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 bg-white"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {vehicle.registration.plateNumber}
                                  </h4>
                                  <p className="text-gray-600">
                                    {vehicle.registration.vehicleType} - {vehicle.registration.make}{' '}
                                    {vehicle.registration.model} ({vehicle.registration.year})
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Station: {vehicle.station.homeStationId.name}
                                  </p>
                                  {vehicle.registration.approvedBy && (
                                    <p className="text-sm text-green-600 mt-1">
                                      ✅ Approved by{' '}
                                      {vehicle.registration.approvedBy.personal.firstName}{' '}
                                      {vehicle.registration.approvedBy.personal.lastName} on{' '}
                                      {formatDate(vehicle.registration.approvalDate)}
                                    </p>
                                  )}
                                </div>
                                <button className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
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
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        Approved Crew Members ({approvedCrew.length})
                      </h3>
                      {approvedCrew.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No approved crew members found</p>
                      ) : (
                        <div className="grid gap-4">
                          {approvedCrew.map((crew) => (
                            <div
                              key={crew._id}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 bg-white"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {crew.personal.firstName} {crew.personal.lastName}
                                  </h4>
                                  <p className="text-gray-600">
                                    {crew.professional.role} - ID: {crew.personal.employeeId}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Email: {crew.personal.email}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Station: {crew.professional.homeStation.name}
                                  </p>
                                  <p className="text-sm text-green-600 mt-1">
                                    ✅ Registered on {formatDate(crew.audit.createdAt)}
                                  </p>
                                </div>
                                <button className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
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

              {/* REJECTED TAB */}
              {activeTab === 'rejected' && (
                <div>
                  {selectedType === 'vehicle' ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        Rejected Vehicles ({rejectedVehicles.length})
                      </h3>
                      {rejectedVehicles.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No rejected vehicles found</p>
                      ) : (
                        <div className="grid gap-4">
                          {rejectedVehicles.map((vehicle) => (
                            <div
                              key={vehicle._id}
                              className="border border-red-200 rounded-lg p-4 bg-red-50 hover:shadow-md transition-shadow duration-200"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {vehicle.registration.plateNumber}
                                  </h4>
                                  <p className="text-gray-700">
                                    {vehicle.registration.vehicleType} - {vehicle.registration.make}{' '}
                                    {vehicle.registration.model} ({vehicle.registration.year})
                                  </p>
                                  {vehicle.registrationStatus?.status === 'rejected' && vehicle.registrationStatus?.rejectedBy && (
                                    <>
                                      <p className="text-sm text-red-700 mt-2 font-medium">
                                        ❌ Rejected by{' '}
                                        {vehicle.registrationStatus.rejectedBy.personal.firstName}{' '}
                                        {vehicle.registrationStatus.rejectedBy.personal.lastName} on{' '}
                                        {formatDate(vehicle.registrationStatus.rejectedAt)}
                                      </p>
                                      <p className="text-sm text-gray-700 mt-1">
                                        <strong>Reason:</strong> {vehicle.registrationStatus.rejectionReason}
                                      </p>
                                    </>
                                  )}
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRejected(vehicle._id, 'vehicle')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
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
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        Rejected Crew Members ({rejectedCrew.length})
                      </h3>
                      {rejectedCrew.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No rejected crew members found</p>
                      ) : (
                        <div className="grid gap-4">
                          {rejectedCrew.map((crew) => (
                            <div
                              key={crew._id}
                              className="border border-red-200 rounded-lg p-4 bg-red-50 hover:shadow-md transition-shadow duration-200"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {crew.personal.firstName} {crew.personal.lastName}
                                  </h4>
                                  <p className="text-gray-700">
                                    {crew.professional.role} - ID: {crew.personal.employeeId}
                                  </p>
                                  {crew.registrationStatus?.status === 'rejected' && crew.registrationStatus?.rejectedBy && (
                                    <>
                                      <p className="text-sm text-red-700 mt-2 font-medium">
                                        ❌ Rejected by{' '}
                                        {crew.registrationStatus.rejectedBy.personal.firstName}{' '}
                                        {crew.registrationStatus.rejectedBy.personal.lastName} on{' '}
                                        {formatDate(crew.registrationStatus.rejectedAt)}
                                      </p>
                                      <p className="text-sm text-gray-700 mt-1">
                                        <strong>Reason:</strong> {crew.registrationStatus.rejectionReason}
                                      </p>
                                    </>
                                  )}
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRejected(crew._id, 'crew')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
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

              {/* DRAFTED TAB */}
              {activeTab === 'drafted' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    Saved Drafts - {selectedType === 'vehicle' ? 'Vehicles' : 'Crew Members'} ({drafts.length})
                  </h3>
                  {drafts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No drafts found</p>
                  ) : (
                    <div className="grid gap-4">
                      {drafts.map((draft) => (
                        <div
                          key={draft._id}
                          className="border border-yellow-200 rounded-lg p-4 bg-yellow-50 hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900">{draft.draftTitle}</h4>
                              <p className="text-gray-600">
                                Step {draft.currentStep} of 3 - {draft.completionPercentage}% Complete
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${draft.completionPercentage}%` }}
                                ></div>
                              </div>
                              <p className="text-sm text-gray-500 mt-2">
                                Last updated: {formatDate(draft.audit.updatedAt)}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                                Continue Editing
                              </button>
                              <button
                                onClick={() => handleDeleteDraft(draft._id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
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
    </div>
    </>
  );
};

export default RegistrationFormsView;
