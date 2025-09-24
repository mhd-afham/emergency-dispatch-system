import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface AuthRouteProps {
  children: React.ReactNode;
}

/**
 * AuthRoute component protects authentication routes (login, register, forgot-password)
 * from being accessed by already authenticated users.
 * If user is authenticated, they are redirected to dashboard.
 */
const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, render the auth form (login, register, etc.)
  return <>{children}</>;
};

export default AuthRoute;
