import React, { useEffect, useState } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

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

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidationChange?: (validation: PasswordValidation) => void;
  showRequirements?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  onValidationChange,
  showRequirements = true,
}) => {
  const [validation, setValidation] = useState<PasswordValidation | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const validatePassword = async () => {
      if (!password) {
        setValidation(null);
        onValidationChange?.(null as any);
        return;
      }

      setIsChecking(true);

      try {
        const response = await fetch(
          `${
            process.env.REACT_APP_API_URL || "http://localhost:5000/api"
          }/auth/validate-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ password }),
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setValidation(data.validation);
          onValidationChange?.(data.validation);
        }
      } catch (error) {
        console.error("Error validating password:", error);
        // Fallback to client-side validation
        const clientValidation = validatePasswordClient(password);
        setValidation(clientValidation);
        onValidationChange?.(clientValidation);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(validatePassword, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [password, onValidationChange]);

  // Client-side fallback validation
  const validatePasswordClient = (pwd: string): PasswordValidation => {
    const requirements = {
      minLength: pwd.length >= 8,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumbers: /\d/.test(pwd),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };

    const errors: string[] = [];
    if (!requirements.minLength)
      errors.push("Must be at least 8 characters long");
    if (!requirements.hasUpperCase)
      errors.push("Must contain at least one uppercase letter");
    if (!requirements.hasLowerCase)
      errors.push("Must contain at least one lowercase letter");
    if (!requirements.hasNumbers)
      errors.push("Must contain at least one number");
    if (!requirements.hasSpecialChar)
      errors.push("Must contain at least one special character");

    const validCount = Object.values(requirements).filter(Boolean).length;
    let strength: "weak" | "medium" | "strong";
    if (validCount >= 5) strength = "strong";
    else if (validCount >= 3) strength = "medium";
    else strength = "weak";

    return {
      isValid: errors.length === 0,
      strength,
      errors,
      requirements,
    };
  };

  if (!password) return null;

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "strong":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "weak":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case "strong":
        return "Strong";
      case "medium":
        return "Medium";
      case "weak":
        return "Weak";
      default:
        return "";
    }
  };

  return (
    <div className="mt-2">
      {/* Strength Indicator Bar */}
      {validation && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Password Strength</span>
            <span
              className={`text-xs font-medium ${
                validation.strength === "strong"
                  ? "text-green-600"
                  : validation.strength === "medium"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {isChecking
                ? "Checking..."
                : getStrengthText(validation.strength)}
            </span>
          </div>

          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((level) => {
              const isActive =
                (validation.strength === "weak" && level === 1) ||
                (validation.strength === "medium" && level <= 2) ||
                (validation.strength === "strong" && level <= 4);

              return (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                    isActive
                      ? getStrengthColor(validation.strength)
                      : "bg-gray-200"
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Requirements Checklist */}
      {showRequirements && validation && (
        <div className="space-y-1">
          <p className="text-xs text-gray-600 mb-2">Password Requirements:</p>

          {Object.entries({
            minLength: "At least 8 characters",
            hasUpperCase: "One uppercase letter (A-Z)",
            hasLowerCase: "One lowercase letter (a-z)",
            hasNumbers: "One number (0-9)",
            hasSpecialChar: "One special character (!@#$%^&*)",
          }).map(([key, label]) => {
            const isValid =
              validation.requirements[
                key as keyof typeof validation.requirements
              ];
            return (
              <div key={key} className="flex items-center text-xs">
                {isValid ? (
                  <CheckIcon className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                ) : (
                  <XMarkIcon className="h-3 w-3 text-red-500 mr-2 flex-shrink-0" />
                )}
                <span className={isValid ? "text-green-600" : "text-red-600"}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
