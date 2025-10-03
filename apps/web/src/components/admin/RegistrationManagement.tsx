import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import VehicleRegistrationWizard from "./VehicleRegistrationWizard";
import CrewRegistrationWizard from "./CrewRegistrationWizard";

interface RegistrationManagementProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type RegistrationMode = "overview" | "vehicle" | "crew";

const RegistrationManagement: React.FC<RegistrationManagementProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const [currentMode, setCurrentMode] = useState<RegistrationMode>("overview");

  // Check if current user is admin or supervisor
  if (!user || !["Admin", "Supervisor"].includes(user.role)) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-red-400 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-red-800 font-medium">Access Denied</p>
        </div>
        <p className="text-red-700 mt-2">
          Only administrators and supervisors can register vehicles and crew members.
        </p>
      </div>
    );
  }

  const handleSuccess = () => {
    setCurrentMode("overview");
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleCancel = () => {
    setCurrentMode("overview");
    if (onCancel) {
      onCancel();
    }
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Registration Management
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Register new vehicles and crew members to the emergency dispatch system
        </p>
      </div>

      {/* Registration Options */}
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
          <div className="p-6">
            <div className="space-y-4">
              <p className="text-gray-600">
                Register new emergency vehicles including ambulances, fire engines,
                and rescue vehicles with their equipment inventory.
              </p>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Registration Process:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      1
                    </span>
                    Basic vehicle information
                  </li>
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      2
                    </span>
                    Technical specifications
                  </li>
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      3
                    </span>
                    Equipment inventory
                  </li>
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      4
                    </span>
                    Station assignment
                  </li>
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      5
                    </span>
                    Review and submit
                  </li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Ready to Register a Vehicle?
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Complete registration requires approval from a supervisor
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentMode("vehicle")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    Start Registration
                  </button>
                </div>
              </div>
            </div>
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
          <div className="p-6">
            <div className="space-y-4">
              <p className="text-gray-600">
                Register new crew members including EMTs, paramedics, firefighters,
                and support staff with their certifications.
              </p>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Registration Process:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      1
                    </span>
                    Personal information
                  </li>
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      2
                    </span>
                    Employment details
                  </li>
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      3
                    </span>
                    Certifications & qualifications
                  </li>
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      4
                    </span>
                    Emergency contacts
                  </li>
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      5
                    </span>
                    Review and submit
                  </li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Ready to Register a Crew Member?
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      All crew members are active immediately upon registration
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentMode("crew")}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    Start Registration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Registration Activity
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Pending Vehicle Approvals
                </h4>
                <p className="text-sm text-gray-600">
                  Vehicles awaiting supervisor approval will appear here
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Recent Crew Registrations
                </h4>
                <p className="text-sm text-gray-600">
                  Recently registered crew members will appear here
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Registration Statistics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">--</div>
                    <div className="text-sm text-gray-600">Vehicles Registered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">--</div>
                    <div className="text-sm text-gray-600">Crew Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">--</div>
                    <div className="text-sm text-gray-600">Pending Approvals</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationManagement;