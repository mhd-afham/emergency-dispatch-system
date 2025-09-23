import React, { useState, useRef } from 'react';
import { 
  PhoneIcon, 
  MapPinIcon, 
  ClockIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { CreateIncidentData, geocodeAddress } from '../../services/incidents';

interface IncidentFormProps {
  onSubmit: (data: CreateIncidentData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  initialData?: Partial<CreateIncidentData>;
}

const IncidentForm: React.FC<IncidentFormProps> = ({
  onSubmit,
  isSubmitting,
  onCancel,
  initialData,
}) => {
  const [formData, setFormData] = useState<CreateIncidentData>({
    caller: {
      name: initialData?.caller?.name || '',
      phone: initialData?.caller?.phone || '',
      email: initialData?.caller?.email || '',
      isCallback: initialData?.caller?.isCallback || false,
    },
    classification: {
      type: initialData?.classification?.type || 'Medical',
      subType: initialData?.classification?.subType || '',
      severity: initialData?.classification?.severity || 'Medium',
      priority: initialData?.classification?.priority || 3,
    },
    location: {
      address: {
        street: initialData?.location?.address?.street || '',
        city: initialData?.location?.address?.city || '',
        district: initialData?.location?.address?.district || '',
        postalCode: initialData?.location?.address?.postalCode || '',
        fullAddress: initialData?.location?.address?.fullAddress || '',
      },
      coordinates: initialData?.location?.coordinates,
      accuracy: initialData?.location?.accuracy || 50,
      isVerified: initialData?.location?.isVerified || false,
      verificationMethod: initialData?.location?.verificationMethod || 'Address',
    },
    details: {
      description: initialData?.details?.description || '',
      additionalInfo: initialData?.details?.additionalInfo || '',
      hazards: initialData?.details?.hazards || [],
      accessNotes: initialData?.details?.accessNotes || '',
      landmarksNearby: initialData?.details?.landmarksNearby || [],
    },
    source: 'Web',
  });

  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate caller phone
    if (!formData.caller.phone.trim()) {
      errors.callerPhone = 'Caller phone number is required';
    } else if (!/^(\+94|0)[0-9]{9}$/.test(formData.caller.phone.trim())) {
      errors.callerPhone = 'Please enter a valid Sri Lankan phone number';
    }

    // Validate classification
    if (!formData.classification.type) {
      errors.classificationType = 'Incident type is required';
    }

    if (!formData.classification.severity) {
      errors.classificationSeverity = 'Severity level is required';
    }

    // Validate location
    if (!formData.location.address.fullAddress.trim()) {
      errors.locationAddress = 'Location address is required';
    }

    // Validate details
    if (!formData.details.description.trim()) {
      errors.detailsDescription = 'Incident description is required';
    } else if (formData.details.description.trim().length < 10) {
      errors.detailsDescription = 'Description must be at least 10 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    section: keyof CreateIncidentData,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));

    // Clear validation error for this field
    const errorKey = `${section}${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleNestedInputChange = (
    section: keyof CreateIncidentData,
    nestedSection: string,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [nestedSection]: {
          ...(prev[section] as any)[nestedSection],
          [field]: value,
        },
      },
    }));
  };

  const handleGeocodeAddress = async () => {
    if (!formData.location.address.fullAddress.trim()) return;

    setIsGeocodingAddress(true);
    try {
      const coordinates = await geocodeAddress(formData.location.address.fullAddress);
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: {
            type: 'Point',
            coordinates: coordinates,
          },
          isVerified: true,
          verificationMethod: 'Address',
        },
      }));
    } catch (error) {
      console.error('Geocoding failed:', error);
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Auto-geocode if coordinates not available
    if (!formData.location.coordinates && formData.location.address.fullAddress.trim()) {
      await handleGeocodeAddress();
    }

    onSubmit(formData);
  };

  const addHazard = () => {
    const hazardInput = (document.getElementById('newHazard') as HTMLInputElement);
    const hazard = hazardInput?.value.trim();
    if (hazard && !formData.details.hazards?.includes(hazard)) {
      setFormData(prev => ({
        ...prev,
        details: {
          ...prev.details,
          hazards: [...(prev.details.hazards || []), hazard],
        },
      }));
      hazardInput.value = '';
    }
  };

  const removeHazard = (hazard: string) => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        hazards: prev.details.hazards?.filter(h => h !== hazard) || [],
      },
    }));
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Caller Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <PhoneIcon className="h-5 w-5 mr-2 text-green-600" />
          Caller Information
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Caller Name
            </label>
            <input
              type="text"
              value={formData.caller.name}
              onChange={(e) => handleInputChange('caller', 'name', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.caller.phone}
              onChange={(e) => handleInputChange('caller', 'phone', e.target.value)}
              className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.callerPhone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+94 or 0XXXXXXXXX"
              required
            />
            {validationErrors.callerPhone && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.callerPhone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={formData.caller.email}
              onChange={(e) => handleInputChange('caller', 'email', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isCallback"
              checked={formData.caller.isCallback}
              onChange={(e) => handleInputChange('caller', 'isCallback', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isCallback" className="ml-2 block text-sm text-gray-900">
              This is a callback
            </label>
          </div>
        </div>
      </div>

      {/* Incident Classification */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
          Incident Classification
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Incident Type *
            </label>
            <select
              value={formData.classification.type}
              onChange={(e) => handleInputChange('classification', 'type', e.target.value)}
              className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.classificationType ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="Medical">Medical Emergency</option>
              <option value="Fire">Fire Emergency</option>
              <option value="Rescue">Rescue Operation</option>
              <option value="Police">Police Required</option>
              <option value="Other">Other</option>
            </select>
            {validationErrors.classificationType && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.classificationType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sub-Type
            </label>
            <input
              type="text"
              value={formData.classification.subType}
              onChange={(e) => handleInputChange('classification', 'subType', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Specific incident type"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Severity Level *
            </label>
            <select
              value={formData.classification.severity}
              onChange={(e) => handleInputChange('classification', 'severity', e.target.value)}
              className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.classificationSeverity ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {validationErrors.classificationSeverity && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.classificationSeverity}</p>
            )}
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
          Location Information
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Address *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.location.address.fullAddress}
                onChange={(e) => handleNestedInputChange('location', 'address', 'fullAddress', e.target.value)}
                className={`flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.locationAddress ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Complete address with landmarks"
                required
              />
              <button
                type="button"
                onClick={handleGeocodeAddress}
                disabled={isGeocodingAddress || !formData.location.address.fullAddress.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeocodingAddress ? (
                  <ClockIcon className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </button>
            </div>
            {validationErrors.locationAddress && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.locationAddress}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Street
              </label>
              <input
                type="text"
                value={formData.location.address.street}
                onChange={(e) => handleNestedInputChange('location', 'address', 'street', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Street name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                value={formData.location.address.city}
                onChange={(e) => handleNestedInputChange('location', 'address', 'city', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                District
              </label>
              <input
                type="text"
                value={formData.location.address.district}
                onChange={(e) => handleNestedInputChange('location', 'address', 'district', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="District"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.location.address.postalCode}
                onChange={(e) => handleNestedInputChange('location', 'address', 'postalCode', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Postal code"
              />
            </div>
          </div>

          {formData.location.coordinates && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                ✅ Location verified: {formData.location.coordinates.coordinates[1].toFixed(6)}, {formData.location.coordinates.coordinates[0].toFixed(6)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Incident Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Incident Details
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              value={formData.details.description}
              onChange={(e) => handleInputChange('details', 'description', e.target.value)}
              rows={4}
              className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.detailsDescription ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Detailed description of the emergency situation..."
              required
            />
            {validationErrors.detailsDescription && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.detailsDescription}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Additional Information
            </label>
            <textarea
              value={formData.details.additionalInfo}
              onChange={(e) => handleInputChange('details', 'additionalInfo', e.target.value)}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional relevant information..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Access Notes
            </label>
            <input
              type="text"
              value={formData.details.accessNotes}
              onChange={(e) => handleInputChange('details', 'accessNotes', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Special access instructions, gate codes, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hazards
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                id="newHazard"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add hazard (e.g., fire, chemicals, unstable structure)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHazard())}
              />
              <button
                type="button"
                onClick={addHazard}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Add
              </button>
            </div>
            {(formData.details.hazards?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.details.hazards?.map((hazard, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800"
                  >
                    {hazard}
                    <button
                      type="button"
                      onClick={() => removeHazard(hazard)}
                      className="ml-2 text-yellow-600 hover:text-yellow-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
        >
          {isSubmitting ? (
            <>
              <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Incident'
          )}
        </button>
      </div>
    </form>
  );
};

export default IncidentForm;