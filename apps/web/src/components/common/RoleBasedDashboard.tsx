import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import ModularAdminDashboard from "../../pages/ModularAdminDashboard";
import CallTakerDashboard from "../../pages/CallTakerDashboard";
import DispatcherDashboard from "../../pages/DispatcherDashboard";
import ModularSupervisorDashboard from "../../pages/ModularSupervisorDashboard";

const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case "Admin":
      return <ModularAdminDashboard />;
    case "Call Taker":
      return <CallTakerDashboard />;
    case "Dispatcher":
      return <DispatcherDashboard />;
    case "Supervisor":
      return <ModularSupervisorDashboard />;
    case "Field Crew":
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Field Crew Dashboard
            </h2>
            <p className="text-gray-600 mb-8">
              Assignment management and incident reporting
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800">Available via mobile application</p>
            </div>
          </div>
        </div>
      );
    case "Citizen":
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Restricted
            </h2>
            <p className="text-gray-600 mb-8">
              Citizen access is available through the mobile application only
            </p>
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">
                Please use the Respondr mobile app for citizen services
              </p>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Unknown Role
            </h2>
            <p className="text-gray-600">
              Your user role "{user.role}" is not recognized. Please contact
              your administrator.
            </p>
          </div>
        </div>
      );
  }
};

export default RoleBasedDashboard;
