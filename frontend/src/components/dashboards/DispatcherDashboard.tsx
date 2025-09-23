import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import DashboardHeader from "../common/DashboardHeader";
import {
  PhoneIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const DispatcherDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header */}
      <DashboardHeader
        user={user!}
        title="Dispatcher Dashboard"
        icon={<PhoneIcon className="h-6 w-6" />}
        color="#3b82f6" // Blue theme for dispatcher
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <PhoneIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Dispatcher Dashboard
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Welcome to the Emergency Dispatch Control Center
              </p>
              <p className="text-sm text-gray-500">
                Role: {user?.role} | Employee ID: {user?.employeeId}
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-red-100 p-4 rounded-lg">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-800">
                    Emergency Calls
                  </p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg">
                  <MapPinIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-yellow-800">
                    Active Incidents
                  </p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg">
                  <PhoneIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-800">
                    Available Units
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DispatcherDashboard;
