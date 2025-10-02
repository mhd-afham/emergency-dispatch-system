import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationModal from '../common/NotificationModal';
import { useNotification } from '../../hooks/useNotification';
import MapLocationPicker from './MapLocationPicker';

/**
 * Emergency Incident Intake Form Component
 * Implements US-002: Emergency Call Logging with structured intake forms
 * Used by Call Takers to log emergency incidents with proper validation
 */

interface IncidentFormData {
  // Caller Information
  callerInfo: {
    name: string;
    contactNumber: string;
    alternateContact?: string;
    reportingMethod: 'phone_call' | 'mobile_app' | 'sms' | 'walk_in' | 'third_party';
  };
  
  // Incident Classification
  incidentType: 'medical' | 'fire' | 'rescue' | 'hazmat' | 'traffic' | 'other' | '';
  incidentCategory: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  
  // Location Information
  location: {
    address: string;
    city: string;
    province: string;
    coordinates?: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
    locationAccuracy?: 'exact' | 'approximate' | 'general_area';
    landmarks?: string;
  };
  
  estimatedResponseTime?: number;
}

interface IncidentCategory {
  value: string;
  label: string;
}

interface IncidentFormProps {
  onSuccess?: (data: any) => void;
  onCancel: () => void;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { notification, showSuccess, showError, hideNotification } = useNotification();

  // Form state management
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<IncidentFormData>({
    callerInfo: {
      name: '',
      contactNumber: '',
      alternateContact: '',
      reportingMethod: 'phone_call'
    },
    incidentType: '',
    incidentCategory: '',
    severity: 'medium',
    description: '',
    location: {
      address: '',
      city: '',
      province: 'Western', // Default to Western province
      locationAccuracy: 'approximate',
      landmarks: ''
    }
  });

  // Available incident categories based on selected type
  const [availableCategories, setAvailableCategories] = useState<IncidentCategory[]>([]);
  
  // Form validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Loading state for categories
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Map functionality state
  const [showMap, setShowMap] = useState(false);
  const [mapSelectedLocation, setMapSelectedLocation] = useState<any>(null);

  // Sri Lankan provinces for dropdown
  const provinces = [
    'Western', 'Central', 'Southern', 'Northern', 'Eastern',
    'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
  ];

  // Reporting methods for dropdown
  const reportingMethods = [
    { value: 'phone_call', label: 'Phone Call' },
    { value: 'mobile_app', label: 'Mobile App' },
    { value: 'sms', label: 'SMS' },
    { value: 'walk_in', label: 'Walk-in' },
    { value: 'third_party', label: 'Third Party Report' }
  ];

  // Incident types
  const incidentTypes = [
    { value: 'medical', label: 'Medical Emergency' },
    { value: 'fire', label: 'Fire Emergency' },
    { value: 'rescue', label: 'Rescue Operation' },
    { value: 'hazmat', label: 'Hazardous Materials' },
    { value: 'traffic', label: 'Traffic Incident' },
    { value: 'other', label: 'Other Emergency' }
  ];

  // Severity levels
  const severityLevels = [
    { value: 'low', label: 'Low Priority', color: 'text-green-600' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'high', label: 'High Priority', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical Priority', color: 'text-red-600' }
  ];

  /**
   * Fetch available categories when incident type changes
   */
  useEffect(() => {
    if (formData.incidentType) {
      // Immediately set static categories for better UX
      setAvailableCategories(getStaticCategories(formData.incidentType));
      // Then try to fetch from API (this can override if successful)
      fetchIncidentCategories(formData.incidentType);
    } else {
      setAvailableCategories([]);
      setFormData(prev => ({ ...prev, incidentCategory: '' }));
    }
  }, [formData.incidentType]);

  /**
   * Fetch incident categories from API based on type
   */
  const fetchIncidentCategories = async (type: string) => {
    try {
      setLoadingCategories(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/incidents/categories/${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data.data.categories || []);
      } else {
        console.error('Failed to fetch categories');
        // Fallback to static categories if API fails
        setAvailableCategories(getStaticCategories(type));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to static categories if API fails
      setAvailableCategories(getStaticCategories(type));
    } finally {
      setLoadingCategories(false);
    }
  };

  /**
   * Get static categories as fallback
   */
  const getStaticCategories = (type: string): IncidentCategory[] => {
    const categoryMap: Record<string, IncidentCategory[]> = {
      medical: [
        { value: 'cardiac_arrest', label: 'Cardiac Arrest' },
        { value: 'breathing_difficulty', label: 'Breathing Difficulty' },
        { value: 'unconscious', label: 'Unconscious Person' },
        { value: 'injury', label: 'Injury/Trauma' },
        { value: 'poisoning', label: 'Poisoning' },
        { value: 'overdose', label: 'Drug Overdose' },
        { value: 'mental_health', label: 'Mental Health Crisis' },
        { value: 'other_medical', label: 'Other Medical Emergency' }
      ],
      fire: [
        { value: 'structure_fire', label: 'Structure Fire' },
        { value: 'vehicle_fire', label: 'Vehicle Fire' },
        { value: 'wildfire', label: 'Wildfire/Bush Fire' },
        { value: 'gas_leak', label: 'Gas Leak' },
        { value: 'explosion', label: 'Explosion' },
        { value: 'electrical_fire', label: 'Electrical Fire' },
        { value: 'other_fire', label: 'Other Fire Emergency' }
      ],
      rescue: [
        { value: 'water_rescue', label: 'Water Rescue' },
        { value: 'high_angle', label: 'High Angle Rescue' },
        { value: 'confined_space', label: 'Confined Space' },
        { value: 'vehicle_entrapment', label: 'Vehicle Entrapment' },
        { value: 'building_collapse', label: 'Building Collapse' },
        { value: 'other_rescue', label: 'Other Rescue Emergency' }
      ],
      hazmat: [
        { value: 'chemical_spill', label: 'Chemical Spill' },
        { value: 'gas_leak_hazmat', label: 'Hazardous Gas Leak' },
        { value: 'radiation', label: 'Radiation Incident' },
        { value: 'biological', label: 'Biological Hazard' },
        { value: 'other_hazmat', label: 'Other Hazmat Emergency' }
      ],
      traffic: [
        { value: 'vehicle_accident', label: 'Vehicle Accident' },
        { value: 'pedestrian_accident', label: 'Pedestrian Accident' },
        { value: 'motorcycle_accident', label: 'Motorcycle Accident' },
        { value: 'hit_and_run', label: 'Hit and Run' },
        { value: 'road_obstruction', label: 'Road Obstruction' },
        { value: 'other_traffic', label: 'Other Traffic Emergency' }
      ],
      other: [
        { value: 'natural_disaster', label: 'Natural Disaster' },
        { value: 'power_outage', label: 'Power Outage' },
        { value: 'public_disturbance', label: 'Public Disturbance' },
        { value: 'security_threat', label: 'Security Threat' },
        { value: 'animal_emergency', label: 'Animal Emergency' },
        { value: 'other_emergency', label: 'Other Emergency' }
      ]
    };
    
    return categoryMap[type] || [];
  };

  /**
   * Handle input changes with proper typing
   */
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev } as any;
      
      // Handle nested objects
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newData[parent] = {
          ...(newData[parent] || {}),
          [child]: value
        };
      } else {
        newData[field] = value;
      }
      
      return newData;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Validate form data before submission
   */
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Caller Information Validation
    if (!formData.callerInfo.name.trim()) {
      newErrors['callerInfo.name'] = 'Caller name is required';
    }

    if (!formData.callerInfo.contactNumber.trim()) {
      newErrors['callerInfo.contactNumber'] = 'Contact number is required';
    } else if (!/^(\+94|0)?[1-9]\d{8}$/.test(formData.callerInfo.contactNumber)) {
      newErrors['callerInfo.contactNumber'] = 'Please enter a valid Sri Lankan phone number';
    }

    // Incident Classification Validation
    if (!formData.incidentType) {
      newErrors['incidentType'] = 'Incident type is required';
    }

    if (!formData.incidentCategory) {
      newErrors['incidentCategory'] = 'Incident category is required';
    }

    if (!formData.description.trim()) {
      newErrors['description'] = 'Incident description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors['description'] = 'Description must be at least 10 characters';
    }

    // Location Validation
    if (!formData.location.address.trim()) {
      newErrors['location.address'] = 'Address is required';
    }

    if (!formData.location.city.trim()) {
      newErrors['location.city'] = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Make API call to create incident
      const token = localStorage.getItem('token');
      console.log('🔍 Form data being sent:', JSON.stringify(formData, null, 2));
      console.log('🔍 Token available:', !!token);
      
      const response = await fetch('http://localhost:5000/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log('📬 Response status:', response.status);
      console.log('📬 Response result:', result);

      if (response.ok) {
        // Success
        console.log('✅ Incident created successfully:', result);
        showSuccess(
          'Incident Created Successfully!',
          `Emergency incident ${result.data.incident.incidentId} has been logged and is now pending dispatch.`,
          'Continue'
        );
        // Delay the onSuccess callback to allow user to see the success message
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(result);
          }
        }, 2000);
      } else {
        // Error from API
        console.error('❌ Error creating incident:', result);
        showError(
          'Failed to Create Incident',
          result.message || 'An error occurred while creating the incident. Please check your information and try again.',
          'Try Again'
        );
      }
    } catch (error) {
      console.error('Network error:', error);
      showError(
        'Connection Error',
        'Failed to connect to the server. Please check your internet connection and try again.',
        'Retry'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get current timestamp for display
   */
  const getCurrentTimestamp = () => {
    return new Date().toLocaleString('en-LK', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      {/* Form Header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Emergency Incident Intake
        </h2>
        <div className="text-sm text-gray-600 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Call Taker:</span> {user?.firstName} {user?.lastName}
          </div>
          <div>
            <span className="font-medium">Timestamp:</span> {getCurrentTimestamp()}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Caller Information Section */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Caller Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Caller Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caller Name *
              </label>
              <input
                type="text"
                value={formData.callerInfo.name}
                onChange={(e) => handleInputChange('callerInfo.name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors['callerInfo.name'] ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter caller's full name"
                disabled={isLoading}
              />
              {errors['callerInfo.name'] && (
                <p className="text-red-600 text-sm mt-1">{errors['callerInfo.name']}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number *
              </label>
              <input
                type="tel"
                value={formData.callerInfo.contactNumber}
                onChange={(e) => handleInputChange('callerInfo.contactNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors['callerInfo.contactNumber'] ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="07X-XXXXXXX or 011-XXXXXXX"
                disabled={isLoading}
              />
              {errors['callerInfo.contactNumber'] && (
                <p className="text-red-600 text-sm mt-1">{errors['callerInfo.contactNumber']}</p>
              )}
            </div>

            {/* Alternate Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alternate Contact
              </label>
              <input
                type="tel"
                value={formData.callerInfo.alternateContact}
                onChange={(e) => handleInputChange('callerInfo.alternateContact', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional alternate number"
                disabled={isLoading}
              />
            </div>

            {/* Reporting Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reporting Method
              </label>
              <select
                value={formData.callerInfo.reportingMethod}
                onChange={(e) => handleInputChange('callerInfo.reportingMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                {reportingMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Incident Classification Section */}
        <div className="bg-orange-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Incident Classification
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Incident Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incident Type *
              </label>
              <select
                value={formData.incidentType}
                onChange={(e) => handleInputChange('incidentType', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors['incidentType'] ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="">Select incident type...</option>
                {incidentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors['incidentType'] && (
                <p className="text-red-600 text-sm mt-1">{errors['incidentType']}</p>
              )}
            </div>

            {/* Incident Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incident Category *
              </label>
              <select
                value={formData.incidentCategory}
                onChange={(e) => handleInputChange('incidentCategory', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors['incidentCategory'] ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading || loadingCategories || !formData.incidentType}
              >
                <option value="">
                  {loadingCategories ? 'Loading categories...' : 
                   !formData.incidentType ? 'Select incident type first' : 
                   'Select category...'}
                </option>
                {availableCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors['incidentCategory'] && (
                <p className="text-red-600 text-sm mt-1">{errors['incidentCategory']}</p>
              )}
            </div>

            {/* Severity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity Level *
              </label>
              <select
                value={formData.severity}
                onChange={(e) => handleInputChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                {severityLevels.map(level => (
                  <option key={level.value} value={level.value} className={level.color}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Response Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Response Time (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.estimatedResponseTime || ''}
                onChange={(e) => handleInputChange('estimatedResponseTime', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave empty for auto-calculation"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Incident Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors['description'] ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Provide detailed description of the emergency situation..."
              disabled={isLoading}
            />
            <div className="flex justify-between items-center mt-1">
              {errors['description'] && (
                <p className="text-red-600 text-sm">{errors['description']}</p>
              )}
              <span className="text-sm text-gray-500 ml-auto">
                {formData.description.length}/1000 characters
              </span>
            </div>
          </div>
        </div>

        {/* Location Information Section */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location Information
          </h3>

          {/* Map Toggle Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {showMap ? 'Hide Map' : 'Select Location on Map'}
            </button>
          </div>

          {/* Google Maps Integration */}
          {showMap && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Click on the map to select incident location
              </label>
              <MapLocationPicker
                onLocationSelect={(location) => {
                  setMapSelectedLocation(location);
                  // Auto-fill form fields
                  handleInputChange('location.address', location.address);
                  handleInputChange('location.city', location.city);
                  // Set coordinates
                  setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      coordinates: {
                        type: 'Point',
                        coordinates: location.coordinates
                      },
                      locationAccuracy: 'exact'
                    }
                  }));
                }}
                className="w-full"
              />
              {mapSelectedLocation && (
                <div className="mt-3 p-3 bg-green-100 rounded-md">
                  <p className="text-sm text-green-800 font-medium">
                    📍 Selected Location: {mapSelectedLocation.formattedAddress}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Coordinates: {mapSelectedLocation.coordinates[1].toFixed(6)}, {mapSelectedLocation.coordinates[0].toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address * {mapSelectedLocation && <span className="text-green-600">(Auto-filled from map)</span>}
              </label>
              <input
                type="text"
                value={formData.location.address}
                onChange={(e) => handleInputChange('location.address', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors['location.address'] ? 'border-red-300' : 'border-gray-300'
                } ${mapSelectedLocation ? 'bg-green-50' : ''}`}
                placeholder="Enter street address or location description"
                disabled={isLoading}
              />
              {errors['location.address'] && (
                <p className="text-red-600 text-sm mt-1">{errors['location.address']}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City * {mapSelectedLocation && <span className="text-green-600">(Auto-filled from map)</span>}
              </label>
              <input
                type="text"
                value={formData.location.city}
                onChange={(e) => handleInputChange('location.city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors['location.city'] ? 'border-red-300' : 'border-gray-300'
                } ${mapSelectedLocation ? 'bg-green-50' : ''}`}
                placeholder="Enter city or town"
                disabled={isLoading}
              />
              {errors['location.city'] && (
                <p className="text-red-600 text-sm mt-1">{errors['location.city']}</p>
              )}
            </div>

            {/* Province */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province *
              </label>
              <select
                value={formData.location.province}
                onChange={(e) => handleInputChange('location.province', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                {provinces.map(province => (
                  <option key={province} value={province}>
                    {province} Province
                  </option>
                ))}
              </select>
            </div>

            {/* Location Accuracy Display */}
            {formData.location.coordinates && (
              <div className="md:col-span-2">
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-md">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-blue-800">
                    GPS coordinates captured: {formData.location.locationAccuracy} location
                  </span>
                </div>
              </div>
            )}

            {/* Landmarks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nearby Landmarks
              </label>
              <input
                type="text"
                value={formData.location.landmarks}
                onChange={(e) => handleInputChange('location.landmarks', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notable landmarks, buildings, or reference points nearby"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Incident...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Emergency Incident
              </>
            )}
          </button>
        </div>
      </form>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        onConfirm={hideNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        confirmText={notification.confirmText}
        cancelText={notification.cancelText}
      />
    </div>
  );
};

export default IncidentForm;