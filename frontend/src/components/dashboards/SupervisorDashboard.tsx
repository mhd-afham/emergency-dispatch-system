import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  ChartBarIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

const SupervisorDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Emergency Management System
                </h1>
                <p className="text-sm text-gray-500">Supervisor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <ChartBarIcon className="mx-auto h-16 w-16 text-purple-600 mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Supervisor Dashboard
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Welcome to the Emergency Operations Management Center
              </p>
              <p className="text-sm text-gray-500">
                Role: {user?.role} | Employee ID: {user?.employeeId}
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-purple-100 p-4 rounded-lg">
                  <ChartBarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-800">
                    Performance Reports
                  </p>
                </div>
                <div className="bg-blue-100 p-4 rounded-lg">
                  <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-800">
                    Team Management
                  </p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-800">
                    Operations Overview
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

export default SupervisorDashboard;
