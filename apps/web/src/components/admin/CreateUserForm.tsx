import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import PasswordStrengthIndicator from "../auth/PasswordStrengthIndicator";

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

interface CreateUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    employeeId: "",
    role: "call_taker",
    department: "",
    phone: "",
    password: "",
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if current user is admin
  if (user?.role !== "Admin") {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-red-400 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-red-800 font-medium">Access Denied</p>
        </div>
        <p className="text-red-700 mt-2">
          Only system administrators can create user accounts.
        </p>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific errors
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Clear general errors
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handlePasswordValidationChange = (validation: PasswordValidation) => {
    setPasswordValidation(validation);
  };

  const validateForm = () => {
    const newErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.firstName.trim())
      newFieldErrors.firstName = "First name is required";
    if (!formData.lastName.trim())
      newFieldErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newFieldErrors.email = "Email is required";
    if (!formData.employeeId.trim())
      newFieldErrors.employeeId = "Employee ID is required";
    if (!formData.role) newFieldErrors.role = "Role is required";
    if (!formData.department.trim())
      newFieldErrors.department = "Department is required";
    if (!formData.phone.trim())
      newFieldErrors.phone = "Phone number is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newFieldErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newFieldErrors.password = "Password is required";
    } else if (!passwordValidation || !passwordValidation.isValid) {
      newFieldErrors.password = "Password does not meet security requirements";
    }

    if (!formData.confirmPassword) {
      newFieldErrors.confirmPassword = "Please confirm the password";
    } else if (formData.password !== formData.confirmPassword) {
      newFieldErrors.confirmPassword = "Passwords do not match";
    }

    // Employee ID format validation
    if (formData.employeeId && !/^[A-Z0-9]{6,12}$/.test(formData.employeeId)) {
      newFieldErrors.employeeId =
        "Employee ID must be 6-12 characters (letters and numbers only)";
    }

    setFieldErrors(newFieldErrors);
    if (Object.keys(newFieldErrors).length > 0) {
      newErrors.push("Please fix the highlighted fields");
    }

    setErrors(newErrors);
    return newErrors.length === 0 && Object.keys(newFieldErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000/api"
        }/auth/admin/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            employeeId: formData.employeeId,
            role: formData.role,
            department: formData.department,
            phone: formData.phone,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create user account");
      }

      setIsSuccess(true);

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        employeeId: "",
        role: "call_taker",
        department: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to create user account. Please try again.";
      setErrors([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-green-400 mr-2"
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
          <p className="text-green-800 font-medium">
            User Created Successfully
          </p>
        </div>
        <p className="text-green-700 mt-2">
          The user account has been created and credentials have been prepared
          for secure delivery.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Create User Account
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Add a new user to the emergency dispatch system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Messages */}
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

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 ${
                  fieldErrors.firstName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter first name"
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.firstName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 ${
                  fieldErrors.lastName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter last name"
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 ${
                fieldErrors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="user@respondr.lk"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* Work Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 ${
                  fieldErrors.employeeId ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="EMP001"
                maxLength={12}
              />
              {fieldErrors.employeeId && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.employeeId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 ${
                  fieldErrors.role ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="call_taker">Call Taker</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="supervisor">Shift Supervisor</option>
                <option value="crew_leader">Crew Leader</option>
                <option value="admin">System Administrator</option>
              </select>
              {fieldErrors.role && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.role}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 ${
                  fieldErrors.department ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Emergency Services"
              />
              {fieldErrors.department && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.department}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 ${
                  fieldErrors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="+94 77 123 4567"
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Password Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 ${
                fieldErrors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter secure password"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Password Strength Indicator */}
          <PasswordStrengthIndicator
            password={formData.password}
            onValidationChange={handlePasswordValidationChange}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 ${
                fieldErrors.confirmPassword
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Confirm password"
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.confirmPassword}
              </p>
            )}
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  Passwords do not match
                </p>
              )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={
                isLoading ||
                !passwordValidation ||
                !passwordValidation.isValid ||
                formData.password !== formData.confirmPassword
              }
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? "Creating Account..." : "Create User Account"}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserForm;
