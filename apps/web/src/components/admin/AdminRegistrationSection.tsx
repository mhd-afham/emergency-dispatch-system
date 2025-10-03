import React, { useState } from "react";
import VehicleRegistrationWizard from "./VehicleRegistrationWizard";
import CrewRegistrationWizard from "./CrewRegistrationWizard";

type RegistrationMode = "overview" | "vehicle" | "crew";

/**
 * Admin Registration Section
 * 
 * Clean, minimal UI for vehicle and crew registration.
 * Only displays section titles and action buttons as requested.
 */
const AdminRegistrationSection: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<RegistrationMode>("overview");

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

  // Overview mode - show both registration options (MINIMAL UI)
  return (
    <div className="max-w-5xl mx-auto">
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
    </div>
  );
};

export default AdminRegistrationSection;
