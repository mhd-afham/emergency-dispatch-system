import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
  onBack,
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000/api"
        }/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setSuccess(
        "Password reset instructions have been sent to your email address."
      );
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email");
    } finally {
      setIsLoading(false);
    }
  };

  // Email validation helper function
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
          <div className="mx-auto h-20 w-auto mb-6">
            <img
              src="/images/respondr-vertical.svg"
              alt="Respondr Logo"
              className="h-20 w-auto mx-auto"
            />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            Reset Your Password
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-secondary, #6b7280)" }}
          >
            Enter your email address and we'll send you instructions to reset
            your password
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {success ? (
            // Success State
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Check Your Email
              </h3>
              <p className="text-sm text-gray-600 mb-6">{success}</p>
              <p className="text-xs text-gray-500 mb-4">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => setSuccess(null)}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
                style={{ backgroundColor: "var(--primary)" }}
              >
                Try Again
              </button>
            </div>
          ) : (
            // Form State
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-danger-50 p-4 border border-danger-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-danger-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-danger-800">{error}</p>
                    </div>
                  </div>
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
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="input-field"
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: isLoading
                      ? "var(--accent)"
                      : "var(--primary)",
                    borderColor: "var(--primary)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = "var(--accent)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = "var(--primary)";
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                      Sending Instructions...
                    </>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </button>
              </div>

              {/* Back to Login Link */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium hover:underline cursor-pointer"
                  style={{ color: "var(--primary)" }}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div
          className="text-center text-xs"
          style={{ color: "var(--text-secondary, #9ca3af)" }}
        >
          <p>
            © 2025 Respondr. Secure password recovery for authorized personnel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
