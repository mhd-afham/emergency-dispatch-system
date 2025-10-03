import React, { useState, useEffect } from "react";

// Define interfaces matching backend Vehicle schema exactly
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
  const [generalError, setGeneralError] = useState("");

  // Form data state matching backend schema
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

  // Save to localStorage for persistence
  useEffect(() => {
    const savedData = localStorage.getItem("vehicleRegistrationData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (error) {
        console.warn("Failed to parse saved vehicle registration data");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("vehicleRegistrationData", JSON.stringify(formData));
  }, [formData]);

  // Validation functions
  const validateBasicInfo = (): boolean => {
    const newErrors: ValidationErrors = {};
    const { basic } = formData;

    if (!basic.plateNumber.trim()) {
      newErrors.plateNumber = "Plate number is required";
    } else if (!/^[A-Z]{2,3}-\d{4}$/.test(basic.plateNumber.trim())) {
      newErrors.plateNumber = "Invalid format. Use format like CAB-1234";
    }

    if (!basic.vehicleType.trim()) {
      newErrors.vehicleType = "Vehicle type is required";
    }

    if (!basic.make.trim()) {
      newErrors.make = "Make is required";
    }

    if (!basic.model.trim()) {
      newErrors.model = "Model is required";
    }

    if (!basic.year) {
      newErrors.year = "Year is required";
    } else if (basic.year < 1990 || basic.year > new Date().getFullYear() + 1) {
      newErrors.year = "Year must be between 1990 and next year";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const updateEquipmentItem = (index: number, field: keyof EquipmentItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      equipment: {
        ...prev.equipment,
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
        ...prev.equipment,
        equipmentItems: [
          ...prev.equipment.equipmentItems,
          {
            name: "",
            type: "medical_equipment",
            serialNumber: "",
            status: "operational",
            quantity: "",
          },
        ],
      },
    }));
  };

  const removeEquipmentItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        equipmentItems: prev.equipment.equipmentItems.filter((_, i) => i !== index),
      },
    }));
  };

  const updateStationInfo = (field: keyof VehicleStationInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      station: { ...prev.station, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Step navigation
  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateBasicInfo();
        break;
      case 2:
        isValid = validateEquipmentInfo();
        break;
      case 3:
        isValid = validateStationInfo();
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
      // Create submission data matching backend Vehicle controller expectations
      const submitData = {
        plateNumber: formData.basic.plateNumber,
        vehicleType: formData.basic.vehicleType,
        make: formData.basic.make,
        model: formData.basic.model,
        year: formData.basic.year,
        homeStationId: formData.station.homeStationId,
        equipmentItems: formData.equipment.equipmentItems.filter(
          (item) => item.name && item.quantity
        ),
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

      // Success
      setIsSuccess(true);
      localStorage.removeItem("vehicleRegistrationData");

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error) {
      console.error("Vehicle registration error:", error);
      setGeneralError(error instanceof Error ? error.message : "Failed to register vehicle");
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
          <h2 className="text-2xl font-bold text-green-900 mb-2">Vehicle Registered Successfully!</h2>
          <p className="text-green-700 mb-4">
            Vehicle {formData.basic.plateNumber} has been submitted for approval.
          </p>
          <p className="text-sm text-green-600">
            You will be redirected to the overview page shortly...
          </p>
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-gray-900 pr-8">Vehicle Registration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Step {currentStep} of 3: {currentStep === 1 ? "Basic Information" : currentStep === 2 ? "Equipment Inventory" : "Station Assignment"}
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
                    ${step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}
                  `}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`
                      w-16 h-1 mx-2
                      ${step < currentStep ? "bg-blue-600" : "bg-gray-300"}
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

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Vehicle Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plate Number *
                  </label>
                  <input
                    type="text"
                    value={formData.basic.plateNumber}
                    onChange={(e) => updateBasicInfo("plateNumber", e.target.value.toUpperCase())}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.plateNumber ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="CAB-1234"
                  />
                  {errors.plateNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.plateNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Type *
                  </label>
                  <select
                    value={formData.basic.vehicleType}
                    onChange={(e) => updateBasicInfo("vehicleType", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.vehicleType ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="Ambulance">Ambulance</option>
                    <option value="Fire Engine">Fire Engine</option>
                    <option value="Rescue Vehicle">Rescue Vehicle</option>
                    <option value="Support Vehicle">Support Vehicle</option>
                  </select>
                  {errors.vehicleType && (
                    <p className="mt-1 text-sm text-red-600">{errors.vehicleType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make *
                  </label>
                  <input
                    type="text"
                    value={formData.basic.make}
                    onChange={(e) => updateBasicInfo("make", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.make ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Toyota"
                  />
                  {errors.make && (
                    <p className="mt-1 text-sm text-red-600">{errors.make}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={formData.basic.model}
                    onChange={(e) => updateBasicInfo("model", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.model ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Hiace"
                  />
                  {errors.model && (
                    <p className="mt-1 text-sm text-red-600">{errors.model}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <input
                    type="number"
                    value={formData.basic.year}
                    onChange={(e) => updateBasicInfo("year", parseInt(e.target.value) || "")}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.year ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="2020"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                  />
                  {errors.year && (
                    <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Equipment Inventory */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Equipment Inventory</h3>
                <button
                  type="button"
                  onClick={addEquipmentItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Add Equipment
                </button>
              </div>

              {errors.equipment && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600">{errors.equipment}</p>
                </div>
              )}

              <div className="space-y-4">
                {formData.equipment.equipmentItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-gray-900">Equipment Item {index + 1}</h4>
                      {formData.equipment.equipmentItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEquipmentItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Equipment Name *
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateEquipmentItem(index, "name", e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`equipment_${index}_name`] ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="Defibrillator"
                        />
                        {errors[`equipment_${index}_name`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`equipment_${index}_name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={item.type}
                          onChange={(e) => updateEquipmentItem(index, "type", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="medical_equipment">Medical Equipment</option>
                          <option value="medical_supply">Medical Supply</option>
                          <option value="safety_equipment">Safety Equipment</option>
                          <option value="communication">Communication</option>
                          <option value="other">Other</option>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="SN123456"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={item.status}
                          onChange={(e) => updateEquipmentItem(index, "status", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="operational">Operational</option>
                          <option value="needs_maintenance">Needs Maintenance</option>
                          <option value="out_of_order">Out of Order</option>
                          <option value="missing">Missing</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateEquipmentItem(index, "quantity", parseInt(e.target.value) || "")}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`equipment_${index}_quantity`] ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="1"
                          min="1"
                        />
                        {errors[`equipment_${index}_quantity`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`equipment_${index}_quantity`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Station Assignment */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Station Assignment</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home Station *
                </label>
                <select
                  value={formData.station.homeStationId}
                  onChange={(e) => updateStationInfo("homeStationId", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.homeStationId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a station</option>
                  <option value="67890abcdef1234567890abc">Central Fire Station</option>
                  <option value="67890abcdef1234567890abd">North Emergency Station</option>
                  <option value="67890abcdef1234567890abe">South Medical Station</option>
                  <option value="67890abcdef1234567890abf">East Rescue Station</option>
                  <option value="67890abcdef1234567890ac0">West Support Station</option>
                </select>
                {errors.homeStationId && (
                  <p className="mt-1 text-sm text-red-600">{errors.homeStationId}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Select the primary station where this vehicle will be based
                </p>
              </div>

              {/* Review Summary */}
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Registration Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plate Number:</span>
                    <span className="font-medium">{formData.basic.plateNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{formData.basic.vehicleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="font-medium">{formData.basic.make} {formData.basic.model} ({formData.basic.year})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Equipment Items:</span>
                    <span className="font-medium">{formData.equipment.equipmentItems.filter(item => item.name).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Home Station:</span>
                    <span className="font-medium">
                      {formData.station.homeStationId ? 
                        ["Central Fire Station", "North Emergency Station", "South Medical Station", "East Rescue Station", "West Support Station"][
                          ["67890abcdef1234567890abc", "67890abcdef1234567890abd", "67890abcdef1234567890abe", "67890abcdef1234567890abf", "67890abcdef1234567890ac0"].indexOf(formData.station.homeStationId)
                        ] || "Selected Station" 
                        : "Not selected"
                      }
                    </span>
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
              className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
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
              {isLoading ? "Registering..." : "Register Vehicle"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleRegistrationWizard;