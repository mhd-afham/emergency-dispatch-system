import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AuthRoute from "./components/common/AuthRoute";
import RoleBasedDashboard from "./components/common/RoleBasedDashboard";
import ModularAdminDashboard from "./pages/ModularAdminDashboard";
import CallTakerDashboard from "./pages/CallTakerDashboard";
import DispatcherDashboard from "./pages/DispatcherDashboard";
import ModularSupervisorDashboard from "./pages/ModularSupervisorDashboard";
import LoginForm from "./components/auth/LoginForm";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";

// Landing page redirect component
const LandingRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Landing page - redirect based on auth status */}
              <Route path="/" element={<LandingRedirect />} />

              {/* Auth routes - redirect to dashboard if already logged in */}
              <Route
                path="/login"
                element={
                  <AuthRoute>
                    <LoginForm />
                  </AuthRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <AuthRoute>
                    <ForgotPasswordForm />
                  </AuthRoute>
                }
              />
              <Route
                path="/reset-password/:token"
                element={
                  <AuthRoute>
                    <ResetPasswordForm />
                  </AuthRoute>
                }
              />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <RoleBasedDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Role-specific dashboard routes */}
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute requiredRoles={["Admin"]}>
                    <ModularAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/call-taker"
                element={
                  <ProtectedRoute requiredRoles={["Call Taker"]}>
                    <CallTakerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/dispatcher"
                element={
                  <ProtectedRoute requiredRoles={["Dispatcher"]}>
                    <DispatcherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/supervisor"
                element={
                  <ProtectedRoute requiredRoles={["Supervisor"]}>
                    <ModularSupervisorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/supervisor-legacy"
                element={
                  <ProtectedRoute requiredRoles={["Supervisor"]}>
                    <ModularSupervisorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin only routes example */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRoles={["Admin"]}>
                    <div className="p-8">
                      <h1 className="text-2xl font-bold">Admin Panel</h1>
                      <p>This page is only accessible to Admins.</p>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Catch all - redirect to landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
