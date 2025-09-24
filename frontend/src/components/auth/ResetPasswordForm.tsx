import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";

interface PasswordValidation {
  isValid: boolean;
  strength: "weak" | "medium" | "strong";
  errors: string[];
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumbers: boolean;
    hasSpecialChar: boolean;
  };
}

const ResetPasswordForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordValidation, setPasswordValidation] =
    useState<PasswordValidation>({
      isValid: false,
      errors: [],
      strength: "weak",
      requirements: {
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumbers: false,
        hasSpecialChar: false,
      },
    });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Verify token validity when component mounts
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        const response = await fetch(
          `${
            process.env.REACT_APP_API_URL || "http://localhost:5000/api"
          }/auth/verify-reset-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();
        setTokenValid(data.valid);
      } catch (error) {
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handlePasswordValidationChange = (validation: PasswordValidation) => {
    setPasswordValidation(validation);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    // Client-side validation
    const validationErrors: string[] = [];

    if (!formData.newPassword) {
      validationErrors.push("New password is required");
    } else if (!passwordValidation.isValid) {
      validationErrors.push("Password does not meet strength requirements");
    }

    if (!formData.confirmPassword) {
      validationErrors.push("Please confirm your password");
    } else if (formData.newPassword !== formData.confirmPassword) {
      validationErrors.push("Passwords do not match");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000/api"
        }/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword: formData.newPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Password reset successfully. Please log in with your new password.",
          },
        });
      }, 3000);
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to reset password. Please try again.";
      setErrors([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while verifying token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-600">Verifying reset token...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="font-medium text-red-600 hover:text-red-500"
            >
              Request a new password reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg
                  className="h-8 w-8 text-green-600"
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
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Password Reset Successful
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your password has been successfully reset. You will be redirected
              to the login page shortly.
            </p>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-red-600 hover:text-red-500"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-20 w-auto mb-6">
            <img
              src="/images/respondr-vertical.svg"
              alt="Respondr Logo"
              className="h-20 w-auto mx-auto"
            />
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.length > 0 && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
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
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Enter your new password"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator
              password={formData.newPassword}
              onValidationChange={handlePasswordValidationChange}
            />

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {formData.confirmPassword &&
                formData.newPassword !== formData.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    Passwords do not match
                  </p>
                )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={
                isLoading ||
                !passwordValidation.isValid ||
                formData.newPassword !== formData.confirmPassword
              }
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading && (
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
              )}
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-red-600 hover:text-red-500 cursor-pointer inline-block"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
