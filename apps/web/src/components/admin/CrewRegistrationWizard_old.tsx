import React, { useState, useEffect } from "react";

// Define interfaces for form data
interface CrewPersonalInfo {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
}

interface CrewEmploymentInfo {
  role: string;
  certificationLevel: string;
  hireDate: string;
  department: string;
  supervisor: string;
  workSchedule: string;
  salary: number | "";
}

interface Certification {
  type: string;
  number: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  status: string;
}

interface CrewCertificationsInfo {
  certifications: Certification[];
  specializations: string[];
  languages: string[];
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface CrewEmergencyInfo {
  emergencyContact: EmergencyContact;
  medicalConditions: string;
  bloodType: string;
  allergies: string;
}

interface CrewFormData {
  personal: CrewPersonalInfo;
  employment: CrewEmploymentInfo;
  certifications: CrewCertificationsInfo;
  emergency: CrewEmergencyInfo;
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
  const [generalError, setGeneralError] = useState<string>("");

  // Form data state
  const [formData, setFormData] = useState<CrewFormData>({
    personal: {
      employeeId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      nationality: "Sri Lankan",
      address: {
        street: "",
        city: "",
        postalCode: "",
      },
    },
    employment: {
      role: "EMT",
      certificationLevel: "Basic",
      hireDate: "",
      department: "Emergency Medical Services",
      supervisor: "",
      workSchedule: "Rotating Shifts",
      salary: "",
    },
    certifications: {
      certifications: [
        {
          type: "Basic Life Support",
          number: "",
          issuedBy: "",
          issueDate: "",
          expiryDate: "",
          status: "active",
        },
      ],
      specializations: [],
      languages: ["English", "Sinhala"],
    },
    emergency: {
      emergencyContact: {
        name: "",
        relationship: "",
        phone: "",
        email: "",
      },
      medicalConditions: "",
      bloodType: "",
      allergies: "",
    },
  });

  // Auto-save form data to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("crewRegistrationDraft");
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        setFormData(parsedData);
      } catch (error) {
        console.warn("Failed to parse saved crew registration data");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("crewRegistrationDraft", JSON.stringify(formData));
  }, [formData]);

  const steps = [
    { number: 1, title: "Personal Info", description: "Basic details" },
    { number: 2, title: "Employment", description: "Job details" },
    { number: 3, title: "Certifications", description: "Qualifications" },
    { number: 4, title: "Emergency Info", description: "Emergency contacts" },
    { number: 5, title: "Review", description: "Confirm & submit" },
  ];

  const roles = [
    "EMT",
    "Paramedic",
    "Firefighter",
    "Driver",
    "Supervisor",
    "Dispatcher",
    "Support Staff",
  ];

  const certificationLevels = ["Basic", "Intermediate", "Advanced", "Expert"];

  const departments = [
    "Emergency Medical Services",
    "Fire & Rescue",
    "Communications",
    "Operations",
    "Training",
    "Administration",
  ];

  const workSchedules = [
    "Day Shift",
    "Night Shift",
    "Rotating Shifts",
    "On-Call",
    "Part-time",
  ];

  const certificationTypes = [
    "Basic Life Support",
    "Advanced Life Support",
    "Emergency Medical Technician",
    "Paramedic License",
    "Fire Fighter Certification",
    "Hazmat Certification",
    "CPR Certification",
    "First Aid",
    "Emergency Vehicle Operator",
    "Confined Space Rescue",
  ];

  const specializationOptions = [
    "cardiac_care",
    "trauma",
    "pediatric",
    "geriatric",
    "psychiatric",
    "obstetric",
    "fire_suppression",
    "technical_rescue",
    "hazmat",
    "emergency_driving",
  ];

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const relationships = [
    "Spouse",
    "Parent",
    "Child",
    "Sibling",
    "Guardian",
    "Friend",
    "Other",
  ];

  // Validation functions
  const validatePersonalInfo = (): boolean => {
    const newErrors: ValidationErrors = {};
    const { personal } = formData;

    if (!personal.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required";
    } else if (!/^[A-Z0-9]{6,12}$/.test(personal.employeeId.trim())) {
      newErrors.employeeId = "Employee ID must be 6-12 characters (letters and numbers)";
    }

    if (!personal.firstName.trim()) newErrors.firstName = "First name is required";
    if (!personal.lastName.trim()) newErrors.lastName = "Last name is required";

    if (!personal.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email.trim())) {
      newErrors.email = "Invalid email format";
    }

    if (!personal.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[+]?[0-9\s\-()]{10,15}$/.test(personal.phone.trim())) {
      newErrors.phone = "Invalid phone number format";
    }

    if (!personal.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const age = new Date().getFullYear() - new Date(personal.dateOfBirth).getFullYear();
      if (age < 18 || age > 65) {
        newErrors.dateOfBirth = "Age must be between 18 and 65 years";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmploymentInfo = (): boolean => {
    const newErrors: ValidationErrors = {};
    const { employment } = formData;

    if (!employment.hireDate) newErrors.hireDate = "Hire date is required";
    if (!employment.supervisor.trim()) newErrors.supervisor = "Supervisor name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCertificationsInfo = (): boolean => {
    const newErrors: ValidationErrors = {};
    const { certifications } = formData;

    if (certifications.certifications.length === 0) {
      newErrors.certifications = "At least one certification is required";
    } else {
      certifications.certifications.forEach((cert, index) => {
        if (!cert.type.trim()) {
          newErrors[`cert_${index}_type`] = "Certification type is required";
        }
        if (!cert.number.trim()) {
          newErrors[`cert_${index}_number`] = "Certification number is required";
        }
        if (!cert.issuedBy.trim()) {
          newErrors[`cert_${index}_issuedBy`] = "Issuing authority is required";
        }
        if (!cert.issueDate) {
          newErrors[`cert_${index}_issueDate`] = "Issue date is required";
        }
        if (!cert.expiryDate) {
          newErrors[`cert_${index}_expiryDate`] = "Expiry date is required";
        } else if (new Date(cert.expiryDate) <= new Date()) {
          newErrors[`cert_${index}_expiryDate`] = "Certification must not be expired";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmergencyInfo = (): boolean => {
    const newErrors: ValidationErrors = {};
    const { emergency } = formData;

    if (!emergency.emergencyContact.name.trim()) {
      newErrors.emergencyContactName = "Emergency contact name is required";
    }
    if (!emergency.emergencyContact.relationship.trim()) {
      newErrors.emergencyContactRelationship = "Relationship is required";
    }
    if (!emergency.emergencyContact.phone.trim()) {
      newErrors.emergencyContactPhone = "Emergency contact phone is required";
    } else if (!/^[+]?[0-9\s\-()]{10,15}$/.test(emergency.emergencyContact.phone.trim())) {
      newErrors.emergencyContactPhone = "Invalid phone number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update form data handlers
  const updatePersonalInfo = (field: string, value: string) => {
    if (field.includes("address.")) {
      const addressField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          address: { ...prev.personal.address, [addressField]: value },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        personal: { ...prev.personal, [field]: value },
      }));
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateEmploymentInfo = (field: keyof CrewEmploymentInfo, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      employment: { ...prev.employment, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: {
        ...prev.certifications,
        certifications: prev.certifications.certifications.map((cert, i) =>
          i === index ? { ...cert, [field]: value } : cert
        ),
      },
    }));
  };

  const addCertification = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: {
        ...prev.certifications,
        certifications: [
          ...prev.certifications.certifications,
          {
            type: "",
            number: "",
            issuedBy: "",
            issueDate: "",
            expiryDate: "",
            status: "active",
          },
        ],
      },
    }));
  };

  const removeCertification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: {
        ...prev.certifications,
        certifications: prev.certifications.certifications.filter((_, i) => i !== index),
      },
    }));
  };

  const updateSpecializations = (specialization: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      certifications: {
        ...prev.certifications,
        specializations: checked
          ? [...prev.certifications.specializations, specialization]
          : prev.certifications.specializations.filter((s) => s !== specialization),
      },
    }));
  };

  const updateEmergencyInfo = (field: string, value: string) => {
    if (field.includes("emergencyContact.")) {
      const contactField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        emergency: {
          ...prev.emergency,
          emergencyContact: { ...prev.emergency.emergencyContact, [contactField]: value },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        emergency: { ...prev.emergency, [field]: value },
      }));
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Navigation handlers
  const handleNext = () => {
    let isValid = true;

    switch (currentStep) {
      case 1:
        isValid = validatePersonalInfo();
        break;
      case 2:
        isValid = validateEmploymentInfo();
        break;
      case 3:
        isValid = validateCertificationsInfo();
        break;
      case 4:
        isValid = validateEmergencyInfo();
        break;
    }

    if (isValid && currentStep < 5) {
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

  // Submit form
  const handleSubmit = async () => {
    setIsLoading(true);
    setGeneralError("");

    try {
      const submitData = {
        employeeId: formData.personal.employeeId,
        firstName: formData.personal.firstName,
        lastName: formData.personal.lastName,
        email: formData.personal.email,
        phone: formData.personal.phone,
        dateOfBirth: formData.personal.dateOfBirth,
        nationality: formData.personal.nationality,
        address: formData.personal.address,
        role: formData.employment.role,
        certificationLevel: formData.employment.certificationLevel,
        hireDate: formData.employment.hireDate,
        department: formData.employment.department,
        supervisor: formData.employment.supervisor,
        workSchedule: formData.employment.workSchedule,
        salary: formData.employment.salary,
        certifications: formData.certifications.certifications.filter(
          (cert) => cert.type && cert.number
        ),
        specializations: formData.certifications.specializations,
        languages: formData.certifications.languages,
        emergencyContact: formData.emergency.emergencyContact,
        medicalInfo: {
          conditions: formData.emergency.medicalConditions,
          bloodType: formData.emergency.bloodType,
          allergies: formData.emergency.allergies,
        },
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

      setIsSuccess(true);
      // Clear saved draft
      localStorage.removeItem("crewRegistrationDraft");

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      setGeneralError(error.message || "Failed to register crew member. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center">
          <svg
            className="h-8 w-8 text-green-400 mr-3"
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
          <div>
            <p className="text-green-800 font-medium text-lg">
              Crew Member Registered Successfully!
            </p>
            <p className="text-green-700 mt-1">
              {formData.personal.firstName} {formData.personal.lastName} (ID:{" "}
              {formData.personal.employeeId}) has been registered and is now active in the system.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Crew Member Registration</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete all steps to register a new crew member
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            Cancel Registration
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-gray-300 text-gray-300"
                }`}
              >
                {currentStep > step.number ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    currentStep >= step.number ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-full h-0.5 mx-4 ${
                    currentStep > step.number ? "bg-green-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {generalError && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{generalError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.personal.employeeId}
                  onChange={(e) => updatePersonalInfo("employeeId", e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                    errors.employeeId ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="EMP123456"
                />
                {errors.employeeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.personal.firstName}
                  onChange={(e) => updatePersonalInfo("firstName", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.personal.lastName}
                  onChange={(e) => updatePersonalInfo("lastName", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Silva"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.personal.email}
                  onChange={(e) => updatePersonalInfo("email", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="john.silva@respondr.lk"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.personal.phone}
                  onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="+94 77 123 4567"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.personal.dateOfBirth}
                  onChange={(e) => updatePersonalInfo("dateOfBirth", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                    errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  value={formData.personal.nationality}
                  onChange={(e) => updatePersonalInfo("nationality", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Sri Lankan"
                />
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.personal.address.street}
                    onChange={(e) => updatePersonalInfo("address.street", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.personal.address.city}
                    onChange={(e) => updatePersonalInfo("address.city", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Colombo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.personal.address.postalCode}
                    onChange={(e) => updatePersonalInfo("address.postalCode", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="00100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Employment Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Employment Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.employment.role}
                  onChange={(e) => updateEmploymentInfo("role", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certification Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.employment.certificationLevel}
                  onChange={(e) => updateEmploymentInfo("certificationLevel", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  {certificationLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hire Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.employment.hireDate}
                  onChange={(e) => updateEmploymentInfo("hireDate", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                    errors.hireDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.hireDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.hireDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.employment.department}
                  onChange={(e) => updateEmploymentInfo("department", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supervisor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.employment.supervisor}
                  onChange={(e) => updateEmploymentInfo("supervisor", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                    errors.supervisor ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Jane Smith"
                />
                {errors.supervisor && (
                  <p className="mt-1 text-sm text-red-600">{errors.supervisor}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Schedule
                </label>
                <select
                  value={formData.employment.workSchedule}
                  onChange={(e) => updateEmploymentInfo("workSchedule", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  {workSchedules.map((schedule) => (
                    <option key={schedule} value={schedule}>
                      {schedule}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Salary (LKR)
                </label>
                <input
                  type="number"
                  value={formData.employment.salary}
                  onChange={(e) => updateEmploymentInfo("salary", parseInt(e.target.value) || "")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="75000"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Certifications */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Certifications & Qualifications</h3>
              <button
                onClick={addCertification}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
              >
                Add Certification
              </button>
            </div>

            {errors.certifications && (
              <p className="text-sm text-red-600">{errors.certifications}</p>
            )}

            <div className="space-y-4">
              {formData.certifications.certifications.map((cert, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Certification {index + 1}
                    </h4>
                    {formData.certifications.certifications.length > 1 && (
                      <button
                        onClick={() => removeCertification(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certification Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={cert.type}
                        onChange={(e) => updateCertification(index, "type", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                          errors[`cert_${index}_type`] ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        <option value="">Select certification type</option>
                        {certificationTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {errors[`cert_${index}_type`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`cert_${index}_type`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certificate Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cert.number}
                        onChange={(e) => updateCertification(index, "number", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                          errors[`cert_${index}_number`] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="BLS123456"
                      />
                      {errors[`cert_${index}_number`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`cert_${index}_number`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Issued By <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cert.issuedBy}
                        onChange={(e) => updateCertification(index, "issuedBy", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                          errors[`cert_${index}_issuedBy`] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Sri Lanka Medical Council"
                      />
                      {errors[`cert_${index}_issuedBy`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`cert_${index}_issuedBy`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={cert.status}
                        onChange={(e) => updateCertification(index, "status", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Issue Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={cert.issueDate}
                        onChange={(e) => updateCertification(index, "issueDate", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                          errors[`cert_${index}_issueDate`] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[`cert_${index}_issueDate`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`cert_${index}_issueDate`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={cert.expiryDate}
                        onChange={(e) => updateCertification(index, "expiryDate", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                          errors[`cert_${index}_expiryDate`] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[`cert_${index}_expiryDate`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`cert_${index}_expiryDate`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Specializations */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Specializations</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {specializationOptions.map((spec) => (
                  <label key={spec} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.certifications.specializations.includes(spec)}
                      onChange={(e) => updateSpecializations(spec, e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {spec.replace("_", " ").replace(/\\b\\w/g, (l) => l.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Emergency Information */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Emergency Information</h3>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.emergency.emergencyContact.name}
                    onChange={(e) => updateEmergencyInfo("emergencyContact.name", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                      errors.emergencyContactName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Jane Silva"
                  />
                  {errors.emergencyContactName && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.emergency.emergencyContact.relationship}
                    onChange={(e) =>
                      updateEmergencyInfo("emergencyContact.relationship", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                      errors.emergencyContactRelationship ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select relationship</option>
                    {relationships.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                  {errors.emergencyContactRelationship && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.emergencyContactRelationship}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.emergency.emergencyContact.phone}
                    onChange={(e) => updateEmergencyInfo("emergencyContact.phone", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                      errors.emergencyContactPhone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="+94 77 987 6543"
                  />
                  {errors.emergencyContactPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.emergency.emergencyContact.email || ""}
                    onChange={(e) => updateEmergencyInfo("emergencyContact.email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="jane.silva@email.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Medical Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Type
                  </label>
                  <select
                    value={formData.emergency.bloodType}
                    onChange={(e) => updateEmergencyInfo("bloodType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select blood type</option>
                    {bloodTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allergies
                  </label>
                  <input
                    type="text"
                    value={formData.emergency.allergies}
                    onChange={(e) => updateEmergencyInfo("allergies", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="None known"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Conditions
                  </label>
                  <textarea
                    value={formData.emergency.medicalConditions}
                    onChange={(e) => updateEmergencyInfo("medicalConditions", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    placeholder="Any relevant medical conditions, medications, or health concerns"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Review Registration</h3>

            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              {/* Personal Info Review */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Employee ID:</span>
                    <span className="ml-2 font-medium">{formData.personal.employeeId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">
                      {formData.personal.firstName} {formData.personal.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{formData.personal.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{formData.personal.phone}</span>
                  </div>
                </div>
              </div>

              {/* Employment Info Review */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Employment Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Role:</span>
                    <span className="ml-2 font-medium">{formData.employment.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Level:</span>
                    <span className="ml-2 font-medium">
                      {formData.employment.certificationLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Department:</span>
                    <span className="ml-2 font-medium">{formData.employment.department}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Supervisor:</span>
                    <span className="ml-2 font-medium">{formData.employment.supervisor}</span>
                  </div>
                </div>
              </div>

              {/* Certifications Review */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Certifications</h4>
                <div className="space-y-2">
                  {formData.certifications.certifications
                    .filter((cert) => cert.type && cert.number)
                    .map((cert, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{cert.type}</span>
                        <span className="text-gray-600 ml-2">
                          (#{cert.number}, Expires: {cert.expiryDate})
                        </span>
                      </div>
                    ))}
                </div>
                {formData.certifications.specializations.length > 0 && (
                  <div className="mt-2">
                    <span className="text-gray-600">Specializations:</span>
                    <span className="ml-2 font-medium">
                      {formData.certifications.specializations
                        .map((s) => s.replace("_", " "))
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Emergency Contact Review */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-600">Contact:</span>
                    <span className="ml-2 font-medium">
                      {formData.emergency.emergencyContact.name} (
                      {formData.emergency.emergencyContact.relationship})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">
                      {formData.emergency.emergencyContact.phone}
                    </span>
                  </div>
                  {formData.emergency.bloodType && (
                    <div>
                      <span className="text-gray-600">Blood Type:</span>
                      <span className="ml-2 font-medium">{formData.emergency.bloodType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> This crew member will be registered and immediately
                    available for duty assignment. All certifications will be verified and
                    tracked for renewal dates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`px-6 py-2 border border-gray-300 rounded-md text-sm font-medium ${
              currentStep === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Previous
          </button>

          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Save Draft & Exit
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`px-6 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  isLoading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isLoading ? "Registering..." : "Complete Registration"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrewRegistrationWizard;