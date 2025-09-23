import React from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  DispatcherDashboard,
  CallTakerDashboard,
  ResponderDashboard,
  SupervisorDashboard,
  AdminDashboard,
  CitizenDashboard,
} from "../components/dashboards";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  // Backend returns role directly on user object, not nested under auth
  const role = user.role;

  switch (role) {
    case "Dispatcher":
      return <DispatcherDashboard />;

    case "Call Taker":
      return <CallTakerDashboard />;

    case "Field Crew":
      return <ResponderDashboard />;

    case "Supervisor":
      return <SupervisorDashboard />;

    case "Admin":
      return <AdminDashboard />;

    case "Citizen":
      return <CitizenDashboard />;

    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Unknown Role
            </h2>
            <p className="text-gray-600">
              Your user role "{role}" is not recognized. Please contact your
              administrator.
            </p>
          </div>
        </div>
      );
  }
};

export default Dashboard;
