import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { AuthenticatedUser } from "../../types/auth";

interface DashboardHeaderProps {
  user: AuthenticatedUser;
  title: string;
  icon?: React.ReactNode;
  color?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  title,
  icon,
  color = "var(--primary)",
}) => {
  const { logout } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <div className="flex items-center mr-6">
              <img
                src="/images/respondr-horizontal.svg"
                alt="Respondr Logo"
                className="h-8 w-auto mr-3"
              />
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: "var(--text)" }}
                >
                  Respondr.
                </h1>
              </div>
            </div>

            {icon && (
              <div className="mr-3" style={{ color }}>
                {icon}
              </div>
            )}

            <div>
              <p
                className="text-lg font-semibold"
                style={{ color: "var(--text)" }}
              >
                {title}
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary, #6b7280)" }}
              >
                Role: {user.role}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                Welcome, {user.firstName} {user.lastName}
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--text-secondary, #6b7280)" }}
              >
                {user.employeeId ? `ID: ${user.employeeId}` : "Citizen Account"}
              </p>
            </div>

            <div className="relative">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: color }}
              >
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
            </div>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors duration-200 hover:opacity-90"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
