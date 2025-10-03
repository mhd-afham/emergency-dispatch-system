import React, { useState, useEffect } from "react";

// Define interfaces matching backend Crew schema exactly
interface CrewPersonalInfo {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Certification {
  type: string;
  number: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
}

interface CrewProfessionalInfo {
  role: string;
  certificationLevel: string;
  hireDate: string;
  certifications: Certification[];
  specializations: string[];
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface CrewFormData {
  personal: CrewPersonalInfo;
  professional: CrewProfessionalInfo;
  emergencyContact: EmergencyContact;
}

interface CrewRegistrationWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

const CrewRegistrationWizard: React.FC<CrewRegistrationWizardProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState("");

  // Form data state matching backend schema exactly
  const [formData, setFormData] = useState<CrewFormData>({
    personal: {
      employeeId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
    professional: {
      role: "EMT",
      certificationLevel: "Basic",
      hireDate: "",
      certifications: [
        {
          type: "",
          number: "",
          issuedBy: "",
          issueDate: "",
          expiryDate: "",
        },
      ],
      specializations: [],
    },
    emergencyContact: {
      name: "",
      relationship: "Spouse",
      phone: "",
    },
  });

  // Save to localStorage for persistence
  useEffect(() => {
    const savedData = localStorage.getItem("crewRegistrationData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (error) {
        console.warn("Failed to parse saved crew registration data");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("crewRegistrationData", JSON.stringify(formData));
  }, [formData]);

  // Validation functions
  const validatePersonalInfo = (): boolean => {
    const newErrors: ValidationErrors = {};
    const { personal } = formData;

    if (!personal.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required";
    } else if (!/^EMP[0-9]{6}$/.test(personal.employeeId.trim())) {
      newErrors.employeeId = "Invalid format. Use format EMP123456";
    }

    if (!personal.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!personal.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!personal.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(personal.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!personal.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\\+94[0-9]{9}$/.test(personal.phone.trim())) {
      newErrors.phone = "Invalid format. Use +94xxxxxxxxx";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateProfessionalInfo = (): boolean => {
    const newErrors: ValidationErrors = {};
    const { professional } = formData;

    if (!professional.role.trim()) {
      newErrors.role = "Professional role is required";
    }

    if (!professional.certificationLevel.trim()) {
      newErrors.certificationLevel = "Certification level is required";
    }

    if (!professional.hireDate.trim()) {
      newErrors.hireDate = "Hire date is required";
    }

    // Check if at least one certification has required fields
    const validCertifications = professional.certifications.filter(
      cert => cert.type && cert.number && cert.issuedBy && cert.issueDate && cert.expiryDate
    );

    if (validCertifications.length === 0) {
      newErrors.certifications = "At least one complete certification is required";
    } else {
      professional.certifications.forEach((cert, index) => {
        if (cert.type || cert.number || cert.issuedBy || cert.issueDate || cert.expiryDate) {
          if (!cert.type) newErrors[`cert_${index}_type`] = "Certification type is required";
          if (!cert.number) newErrors[`cert_${index}_number`] = "Certification number is required";
          if (!cert.issuedBy) newErrors[`cert_${index}_issuedBy`] = "Issuing authority is required";
          if (!cert.issueDate) newErrors[`cert_${index}_issueDate`] = "Issue date is required";
          if (!cert.expiryDate) newErrors[`cert_${index}_expiryDate`] = "Expiry date is required";
          if (cert.issueDate && cert.expiryDate && new Date(cert.expiryDate) <= new Date(cert.issueDate)) {
            newErrors[`cert_${index}_expiryDate`] = "Expiry date must be after issue date";
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmergencyContact = (): boolean => {
    const newErrors: ValidationErrors = {};
    const { emergencyContact } = formData;

    if (!emergencyContact.name.trim()) {
      newErrors.emergencyContactName = "Emergency contact name is required";
    }

    if (!emergencyContact.relationship.trim()) {
      newErrors.emergencyContactRelationship = "Relationship is required";
    }

    if (!emergencyContact.phone.trim()) {
      newErrors.emergencyContactPhone = "Emergency contact phone is required";
    } else if (!/^\\+94[0-9]{9}$/.test(emergencyContact.phone.trim())) {
      newErrors.emergencyContactPhone = "Invalid format. Use +94xxxxxxxxx";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update form data handlers
  const updatePersonalInfo = (field: keyof CrewPersonalInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateProfessionalInfo = (field: keyof CrewProfessionalInfo, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      professional: { ...prev.professional, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    setFormData((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        certifications: prev.professional.certifications.map((cert, i) =>
          i === index ? { ...cert, [field]: value } : cert
        ),
      },
    }));
  };

  const addCertification = () => {
    setFormData((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        certifications: [
          ...prev.professional.certifications,
          {
            type: "",
            number: "",
            issuedBy: "",
            issueDate: "",
            expiryDate: "",
          },
        ],
      },
    }));
  };

  const removeCertification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        certifications: prev.professional.certifications.filter((_, i) => i !== index),
      },
    }));
  };

  const updateSpecializations = (specialization: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        specializations: checked
          ? [...prev.professional.specializations, specialization]
          : prev.professional.specializations.filter((s) => s !== specialization),
      },
    }));
  };

  const updateEmergencyContact = (field: keyof EmergencyContact, value: string) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value },
    }));
    if (errors[`emergencyContact${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors((prev) => ({ ...prev, [`emergencyContact${field.charAt(0).toUpperCase() + field.slice(1)}`]: "" }));
    }
  };

  // Step navigation
  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validatePersonalInfo();
        break;
      case 2:
        isValid = validateProfessionalInfo();
        break;
      case 3:
        isValid = validateEmergencyContact();
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setErrors({});
      setGeneralError("");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      setGeneralError("");
    }
  };

  // Submit form - matches backend expectations exactly
  const handleSubmit = async () => {
    setIsLoading(true);
    setGeneralError("");

    try {
      // Create submission data matching backend Crew controller expectations
      const submitData = {
        employeeId: formData.personal.employeeId,
        firstName: formData.personal.firstName,
        lastName: formData.personal.lastName,
        email: formData.personal.email,
        phone: formData.personal.phone,
        role: formData.professional.role,
        certificationLevel: formData.professional.certificationLevel,
        hireDate: formData.professional.hireDate,
        certifications: formData.professional.certifications.filter(
          (cert) => cert.type && cert.number && cert.issuedBy && cert.issueDate && cert.expiryDate
        ),
        specializations: formData.professional.specializations,
        emergencyContact: formData.emergencyContact,
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/crew`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(submitData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to register crew member");
      }

      // Success
      setIsSuccess(true);
      localStorage.removeItem("crewRegistrationData");

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error) {
      console.error("Crew registration error:", error);
      setGeneralError(error instanceof Error ? error.message : "Failed to register crew member");
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <svg className="mx-auto h-16 w-16 text-green-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Crew Member Registered Successfully!</h2>
          <p className="text-green-700 mb-4">
            {formData.personal.firstName} {formData.personal.lastName} has been registered as a crew member.
          </p>
          <p className="text-sm text-green-600">
            You will be redirected to the overview page shortly...
          </p>
        </div>
      </div>
    );
  }

  const availableSpecializations = [
    "cardiac_care",
    "trauma", 
    "pediatric",
    "respiratory",
    "hazmat",
    "rescue_operations",
    "fire_suppression",
    "medical_transport",
    "emergency_medicine",
    "other"
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 relative">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-900 pr-8">Crew Member Registration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Step {currentStep} of 3: {currentStep === 1 ? "Personal Information" : currentStep === 2 ? "Professional Details" : "Emergency Contact"}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${step <= currentStep ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"}
                  `}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`
                      w-16 h-1 mx-2
                      ${step < currentStep ? "bg-green-600" : "bg-gray-300"}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6">
          {generalError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{generalError}</p>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={formData.personal.employeeId}
                    onChange={(e) => updatePersonalInfo("employeeId", e.target.value.toUpperCase())}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.employeeId ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="EMP123456"
                  />
                  {errors.employeeId && (
                    <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.personal.firstName}
                    onChange={(e) => updatePersonalInfo("firstName", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.personal.lastName}
                    onChange={(e) => updatePersonalInfo("lastName", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.personal.email}
                    onChange={(e) => updatePersonalInfo("email", e.target.value.toLowerCase())}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="john.doe@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={formData.personal.phone}
                    onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="+94771234567"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">Sri Lankan phone number format</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Professional Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Role *
                  </label>
                  <select
                    value={formData.professional.role}
                    onChange={(e) => updateProfessionalInfo("role", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.role ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="EMT">EMT</option>
                    <option value="Paramedic">Paramedic</option>
                    <option value="Firefighter">Firefighter</option>
                    <option value="Driver">Driver</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certification Level *
                  </label>
                  <select
                    value={formData.professional.certificationLevel}
                    onChange={(e) => updateProfessionalInfo("certificationLevel", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.certificationLevel ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  {errors.certificationLevel && (
                    <p className="mt-1 text-sm text-red-600">{errors.certificationLevel}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hire Date *
                  </label>
                  <input
                    type="date"
                    value={formData.professional.hireDate}
                    onChange={(e) => updateProfessionalInfo("hireDate", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.hireDate ? "border-red-500" : "border-gray-300"
                    }`}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.hireDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.hireDate}</p>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-md font-medium text-gray-900">Certifications *</h4>
                  <button
                    type="button"
                    onClick={addCertification}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Add Certification
                  </button>
                </div>

                {errors.certifications && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-600">{errors.certifications}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {formData.professional.certifications.map((cert, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h5 className="font-medium text-gray-900">Certification {index + 1}</h5>
                        {formData.professional.certifications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCertification(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Certification Type
                          </label>
                          <input
                            type="text"
                            value={cert.type}
                            onChange={(e) => updateCertification(index, "type", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                              errors[`cert_${index}_type`] ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="EMT Basic"
                          />
                          {errors[`cert_${index}_type`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`cert_${index}_type`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Certificate Number
                          </label>
                          <input
                            type="text"
                            value={cert.number}
                            onChange={(e) => updateCertification(index, "number", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                              errors[`cert_${index}_number`] ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="CERT123456"
                          />
                          {errors[`cert_${index}_number`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`cert_${index}_number`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issued By
                          </label>
                          <input
                            type="text"
                            value={cert.issuedBy}
                            onChange={(e) => updateCertification(index, "issuedBy", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                              errors[`cert_${index}_issuedBy`] ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="Ministry of Health"
                          />
                          {errors[`cert_${index}_issuedBy`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`cert_${index}_issuedBy`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issue Date
                          </label>
                          <input
                            type="date"
                            value={cert.issueDate}
                            onChange={(e) => updateCertification(index, "issueDate", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                              errors[`cert_${index}_issueDate`] ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {errors[`cert_${index}_issueDate`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`cert_${index}_issueDate`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={cert.expiryDate}
                            onChange={(e) => updateCertification(index, "expiryDate", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                              errors[`cert_${index}_expiryDate`] ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {errors[`cert_${index}_expiryDate`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`cert_${index}_expiryDate`]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specializations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specializations
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableSpecializations.map((specialization) => (
                    <label key={specialization} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.professional.specializations.includes(specialization)}
                        onChange={(e) => updateSpecializations(specialization, e.target.checked)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {specialization.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Contact */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact.name}
                    onChange={(e) => updateEmergencyContact("name", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.emergencyContactName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Jane Doe"
                  />
                  {errors.emergencyContactName && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship *
                  </label>
                  <select
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => updateEmergencyContact("relationship", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.emergencyContactRelationship ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.emergencyContactRelationship && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactRelationship}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => updateEmergencyContact("phone", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.emergencyContactPhone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="+94771234567"
                  />
                  {errors.emergencyContactPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone}</p>
                  )}
                </div>
              </div>

              {/* Review Summary */}
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Registration Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee ID:</span>
                    <span className="font-medium">{formData.personal.employeeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{formData.personal.firstName} {formData.personal.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium">{formData.professional.role} ({formData.professional.certificationLevel})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{formData.personal.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Certifications:</span>
                    <span className="font-medium">{formData.professional.certifications.filter(cert => cert.type).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Specializations:</span>
                    <span className="font-medium">{formData.professional.specializations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Emergency Contact:</span>
                    <span className="font-medium">{formData.emergencyContact.name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            {currentStep === 1 ? "Cancel" : "Previous"}
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Registering..." : "Register Crew Member"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrewRegistrationWizard;