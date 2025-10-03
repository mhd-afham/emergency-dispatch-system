import React, { useState, useEffect } from "react";

// Define interfaces matching backend Vehicle schema
interface VehicleBasicInfo {
  plateNumber: string;
  vehicleType: string;
  make: string;
  model: string;
  year: number | "";
}

interface EquipmentItem {
  name: string;
  type: string;
  serialNumber: string;
  status: string;
  quantity: number | "";
}

interface VehicleEquipmentInfo {
  equipmentItems: EquipmentItem[];
}

interface VehicleStationInfo {
  homeStationId: string;
}

interface VehicleFormData {
  basic: VehicleBasicInfo;
  equipment: VehicleEquipmentInfo;
  station: VehicleStationInfo;
}

interface VehicleRegistrationWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

const VehicleRegistrationWizard: React.FC<VehicleRegistrationWizardProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string>("");

  // Form data state
  const [formData, setFormData] = useState<VehicleFormData>({
    basic: {
      plateNumber: "",
      vehicleType: "Ambulance",
      make: "",
      model: "",
      year: "",
    },
    equipment: {
      equipmentItems: [
        {
          name: "",
          type: "medical_equipment",
          serialNumber: "",
          status: "operational",
          quantity: "",
        },
      ],
    },
    station: {
      homeStationId: "",
    },
  });

  // Auto-save form data to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("vehicleRegistrationDraft");
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        setFormData(parsedData);
      } catch (error) {
        console.warn("Failed to parse saved vehicle registration data");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("vehicleRegistrationDraft", JSON.stringify(formData));
  }, [formData]);

  const steps = [
    { number: 1, title: "Basic Information", description: "Vehicle details" },
    { number: 2, title: "Technical Specs", description: "Engine & maintenance" },
    { number: 3, title: "Equipment", description: "Inventory & supplies" },
    { number: 4, title: "Station Assignment", description: "Location & routes" },
    { number: 5, title: "Review", description: "Confirm & submit" },
  ];

  const vehicleTypes = [
    "Ambulance",
    "Fire Engine",
    "Rescue Vehicle",
    "Support Vehicle",
    "Mobile Command Unit",
  ];

  const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid"];

  const equipmentTypes = [
    "medical_equipment",
    "fire_equipment",
    "rescue_equipment",
    "communication_equipment",
    "safety_equipment",
    "navigation_equipment",
  ];

  const equipmentStatuses = ["operational", "maintenance_required", "out_of_service"];

  // Validation functions
  const validateBasicInfo = (): boolean => {
    const newErrors: ValidationErrors = {};
    const { basic } = formData;

    if (!basic.plateNumber.trim()) {
      newErrors.plateNumber = "Plate number is required";
    } else if (!/^[A-Z]{2,3}-\\d{4}$/.test(basic.plateNumber.trim())) {
      newErrors.plateNumber = "Invalid format. Use format like CAB-1234";
    }

    if (!basic.make.trim()) newErrors.make = "Make is required";
    if (!basic.model.trim()) newErrors.model = "Model is required";
    if (!basic.year) {
      newErrors.year = "Year is required";
    } else if (basic.year < 1990 || basic.year > new Date().getFullYear() + 1) {
      newErrors.year = "Year must be between 1990 and next year";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTechnicalInfo = (): boolean => {
    // Technical info removed - skip to equipment
    return true;
  };

  const validateEquipmentInfo = (): boolean => {
    const newErrors: ValidationErrors = {};
    const { equipment } = formData;

    if (equipment.equipmentItems.length === 0) {
      newErrors.equipment = "At least one equipment item is required";
    } else {
      equipment.equipmentItems.forEach((item, index) => {
        if (!item.name.trim()) {
          newErrors[`equipment_${index}_name`] = "Equipment name is required";
        }
        if (!item.quantity || item.quantity <= 0) {
          newErrors[`equipment_${index}_quantity`] = "Quantity must be greater than 0";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStationInfo = (): boolean => {
    const newErrors: ValidationErrors = {};
    const { station } = formData;

    if (!station.homeStationId.trim()) {
      newErrors.homeStationId = "Home station is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update form data handlers
  const updateBasicInfo = (field: keyof VehicleBasicInfo, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      basic: { ...prev.basic, [field]: value },
    }));
    // Clear field-specific error
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateTechnicalInfo = (field: keyof VehicleTechnicalInfo, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      technical: { ...prev.technical, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateEquipmentItem = (index: number, field: keyof EquipmentItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      equipment: {
        equipmentItems: prev.equipment.equipmentItems.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  const addEquipmentItem = () => {
    setFormData((prev) => ({
      ...prev,
      equipment: {
        equipmentItems: [
          ...prev.equipment.equipmentItems,
          {
            name: "",
            type: "medical_equipment",
            serialNumber: "",
            status: "operational",
            quantity: "",
            description: "",
          },
        ],
      },
    }));
  };

  const removeEquipmentItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      equipment: {
        equipmentItems: prev.equipment.equipmentItems.filter((_, i) => i !== index),
      },
    }));
  };

  const updateStationInfo = (field: keyof VehicleStationInfo, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      station: { ...prev.station, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Navigation handlers
  const handleNext = () => {
    let isValid = true;

    switch (currentStep) {
      case 1:
        isValid = validateBasicInfo();
        break;
      case 2:
        isValid = validateTechnicalInfo();
        break;
      case 3:
        isValid = validateEquipmentInfo();
        break;
      case 4:
        isValid = validateStationInfo();
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
        plateNumber: formData.basic.plateNumber,
        vehicleType: formData.basic.vehicleType,
        make: formData.basic.make,
        model: formData.basic.model,
        year: formData.basic.year,
        specifications: {
          engineNumber: formData.technical.engineNumber,
          chassisNumber: formData.technical.chassisNumber,
          fuelType: formData.technical.fuelType,
          capacity: formData.technical.capacity,
          mileage: formData.technical.mileage,
        },
        maintenance: {
          lastMaintenanceDate: formData.technical.lastMaintenanceDate,
        },
        equipmentItems: formData.equipment.equipmentItems.filter(
          (item) => item.name && item.quantity
        ),
        homeStationId: formData.station.homeStationId,
        routes: {
          primary: formData.station.primaryRoute,
          secondary: formData.station.secondaryStations,
        },
        notes: formData.station.notes,
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/vehicles`,
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
        throw new Error(data.message || "Failed to register vehicle");
      }

      setIsSuccess(true);
      // Clear saved draft
      localStorage.removeItem("vehicleRegistrationDraft");

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      setGeneralError(error.message || "Failed to register vehicle. Please try again.");
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
              Vehicle Registration Submitted Successfully!
            </p>
            <p className="text-green-700 mt-1">
              Vehicle {formData.basic.plateNumber} has been submitted for approval.
              You will be notified once a supervisor reviews the registration.
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
            <h2 className="text-2xl font-bold text-gray-900">Vehicle Registration</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete all steps to register a new emergency vehicle
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
                    ? "bg-blue-600 border-blue-600 text-white"
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
                    currentStep >= step.number ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-full h-0.5 mx-4 ${
                    currentStep > step.number ? "bg-blue-600" : "bg-gray-300"
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

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Basic Vehicle Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plate Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.basic.plateNumber}
                  onChange={(e) => updateBasicInfo("plateNumber", e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.plateNumber ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="CAB-1234"
                />
                {errors.plateNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.plateNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.basic.vehicleType}
                  onChange={(e) => updateBasicInfo("vehicleType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.basic.make}
                  onChange={(e) => updateBasicInfo("make", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.make ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Toyota"
                />
                {errors.make && <p className="mt-1 text-sm text-red-600">{errors.make}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.basic.model}
                  onChange={(e) => updateBasicInfo("model", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.model ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="HiAce"
                />
                {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.basic.year}
                  onChange={(e) => updateBasicInfo("year", parseInt(e.target.value) || "")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.year ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="2023"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                />
                {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Technical Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Technical Specifications</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Engine Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.technical.engineNumber}
                  onChange={(e) => updateTechnicalInfo("engineNumber", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.engineNumber ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="1TR-FE-123456"
                />
                {errors.engineNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.engineNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chassis Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.technical.chassisNumber}
                  onChange={(e) => updateTechnicalInfo("chassisNumber", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.chassisNumber ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="JT2RN42R9E0123456"
                />
                {errors.chassisNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.chassisNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.technical.fuelType}
                  onChange={(e) => updateTechnicalInfo("fuelType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {fuelTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (Liters) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.technical.capacity}
                  onChange={(e) => updateTechnicalInfo("capacity", parseInt(e.target.value) || "")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.capacity ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="2000"
                  min="1"
                />
                {errors.capacity && (
                  <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Mileage (km)
                </label>
                <input
                  type="number"
                  value={formData.technical.mileage}
                  onChange={(e) => updateTechnicalInfo("mileage", parseInt(e.target.value) || "")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50000"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Maintenance Date
                </label>
                <input
                  type="date"
                  value={formData.technical.lastMaintenanceDate}
                  onChange={(e) => updateTechnicalInfo("lastMaintenanceDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Equipment Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Equipment Inventory</h3>
              <button
                onClick={addEquipmentItem}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Add Equipment
              </button>
            </div>

            {errors.equipment && (
              <p className="text-sm text-red-600">{errors.equipment}</p>
            )}

            <div className="space-y-4">
              {formData.equipment.equipmentItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Equipment Item {index + 1}
                    </h4>
                    {formData.equipment.equipmentItems.length > 1 && (
                      <button
                        onClick={() => removeEquipmentItem(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equipment Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateEquipmentItem(index, "name", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          errors[`equipment_${index}_name`] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Defibrillator"
                      />
                      {errors[`equipment_${index}_name`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`equipment_${index}_name`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={item.type}
                        onChange={(e) => updateEquipmentItem(index, "type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        {equipmentTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.replace("_", " ").replace(/\\b\\w/g, (l) => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        value={item.serialNumber}
                        onChange={(e) => updateEquipmentItem(index, "serialNumber", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="DEF123456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={item.status}
                        onChange={(e) => updateEquipmentItem(index, "status", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        {equipmentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ").replace(/\\b\\w/g, (l) => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateEquipmentItem(index, "quantity", parseInt(e.target.value) || "")
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          errors[`equipment_${index}_quantity`]
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="1"
                        min="1"
                      />
                      {errors[`equipment_${index}_quantity`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`equipment_${index}_quantity`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) => updateEquipmentItem(index, "description", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Additional notes"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Station Assignment */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Station Assignment</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Home Station ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.station.homeStationId}
                  onChange={(e) => updateStationInfo("homeStationId", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.homeStationId ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="ST001"
                />
                {errors.homeStationId && (
                  <p className="mt-1 text-sm text-red-600">{errors.homeStationId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Route <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.station.primaryRoute}
                  onChange={(e) => updateStationInfo("primaryRoute", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.primaryRoute ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Colombo Central District"
                />
                {errors.primaryRoute && (
                  <p className="mt-1 text-sm text-red-600">{errors.primaryRoute}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes / Special Instructions
              </label>
              <textarea
                value={formData.station.notes}
                onChange={(e) => updateStationInfo("notes", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Any special instructions or notes about this vehicle"
              />
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Review Registration</h3>

            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              {/* Basic Info Review */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Plate Number:</span>
                    <span className="ml-2 font-medium">{formData.basic.plateNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{formData.basic.vehicleType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Make/Model:</span>
                    <span className="ml-2 font-medium">
                      {formData.basic.make} {formData.basic.model}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Year:</span>
                    <span className="ml-2 font-medium">{formData.basic.year}</span>
                  </div>
                </div>
              </div>

              {/* Technical Info Review */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Technical Specifications</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Engine:</span>
                    <span className="ml-2 font-medium">{formData.technical.engineNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Chassis:</span>
                    <span className="ml-2 font-medium">{formData.technical.chassisNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fuel Type:</span>
                    <span className="ml-2 font-medium">{formData.technical.fuelType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Capacity:</span>
                    <span className="ml-2 font-medium">{formData.technical.capacity}L</span>
                  </div>
                </div>
              </div>

              {/* Equipment Review */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Equipment</h4>
                <div className="space-y-2">
                  {formData.equipment.equipmentItems
                    .filter((item) => item.name && item.quantity)
                    .map((item, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-600 ml-2">
                          (Qty: {item.quantity}, Status: {item.status})
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Station Review */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Station Assignment</h4>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-600">Home Station:</span>
                    <span className="ml-2 font-medium">{formData.station.homeStationId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Primary Route:</span>
                    <span className="ml-2 font-medium">{formData.station.primaryRoute}</span>
                  </div>
                  {formData.station.notes && (
                    <div>
                      <span className="text-gray-600">Notes:</span>
                      <span className="ml-2 font-medium">{formData.station.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Important:</strong> This vehicle registration will be submitted for
                    approval. A supervisor must approve the registration before the vehicle can
                    be dispatched for emergency response.
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
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`px-6 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isLoading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isLoading ? "Submitting..." : "Submit Registration"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleRegistrationWizard;