import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError } from "../../types/auth";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Don't clear error immediately on typing - let user see the error message
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    console.log("LoginForm - handleSubmit called with:", formData);

    // Validation
    if (!formData.email.trim()) {
      console.log("LoginForm - Email validation failed");
      setError("Email is required");
      setIsSubmitting(false);
      return;
    }

    if (!formData.password.trim()) {
      console.log("LoginForm - Password validation failed");
      setError("Password is required");
      setIsSubmitting(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      console.log("LoginForm - Email format validation failed");
      setError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("LoginForm - Attempting login...");
      await login(formData);
      onSuccess?.();
      // Navigate to dashboard after successful login
      navigate("/dashboard");
    } catch (err: any) {
      console.log("LoginForm - Login error caught:", err);
      const apiError = err as ApiError;
      const errorMessage = apiError.message || "Login failed";
      console.log("LoginForm - Setting error:", errorMessage);
      setError(errorMessage);
      // Don't clear form data on error - let user retry
    } finally {
      setIsSubmitting(false);
    }
  }; // Email validation helper function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-auto mb-6">
            <img
              src="/images/respondr-vertical.svg"
              alt="Respondr Logo"
              className="h-16 w-auto mx-auto"
            />
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900">
            Emergency Dispatch System
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-secondary, #6b7280)" }}
          >
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div
                className="mb-4 p-4 rounded-lg border border-red-300 bg-red-50 text-red-800 text-sm"
                style={{ display: "block" }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "var(--primary)",
                  borderColor: "var(--primary)",
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = "var(--accent)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = "var(--primary)";
                  }
                }}
              >
                Sign in
              </button>
            </div>

            {/* Admin Note */}
            <div className="text-center">
              <p
                className="text-xs"
                style={{ color: "var(--text-secondary, #6b7280)" }}
              >
                User accounts are created by system administrators only
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          className="text-center text-xs"
          style={{ color: "var(--text-secondary, #9ca3af)" }}
        >
          <p>© 2025 Respondr. Secure access for authorized personnel only.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
