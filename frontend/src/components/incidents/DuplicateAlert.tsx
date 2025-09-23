import React from 'react';
import { 
  ExclamationTriangleIcon, 
  ClockIcon,
  MapPinIcon 
} from '@heroicons/react/24/outline';
import { DuplicateWarning } from '../../services/incidents';

interface DuplicateAlertProps {
  warnings: DuplicateWarning[];
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const DuplicateAlert: React.FC<DuplicateAlertProps> = ({
  warnings,
  onConfirm,
  onCancel,
  isSubmitting,
}) => {
  const formatTimeDiff = (minutes: number): string => {
    if (minutes < 1) return 'Less than 1 minute ago';
    if (minutes < 60) return `${Math.round(minutes)} minutes ago`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m ago`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'medical': return 'text-red-600 bg-red-50 border-red-200';
      case 'fire': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'rescue': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'police': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Warning Header */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800">
              Potential Duplicate Incidents Detected
            </h3>
            <p className="mt-2 text-sm text-yellow-700">
              We found {warnings.length} similar incident{warnings.length !== 1 ? 's' : ''} that may be duplicates. 
              Please review the incidents below and decide whether to proceed with creating a new incident or merge with an existing one.
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate Warnings List */}
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-900">Similar Incidents:</h4>
        
        {warnings.map((warning, index) => (
          <div
            key={warning.incidentId}
            className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="font-mono text-sm font-semibold text-blue-600">
                    {warning.incidentId}
                  </span>
                  
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(warning.type)}`}>
                    {warning.type}
                  </span>
                  
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(warning.severity)}`}>
                    {warning.severity}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>{formatTimeDiff(warning.timeDiff)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>{formatDistance(warning.distance)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700">
                      Similarity: {Math.round(warning.score * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Similarity Score Visual */}
              <div className="ml-4 flex-shrink-0">
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${warning.score * 251.2} 251.2`}
                      className={warning.score > 0.8 ? 'text-red-500' : warning.score > 0.6 ? 'text-yellow-500' : 'text-blue-500'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">
                      {Math.round(warning.score * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-md p-4">
        <h5 className="font-medium text-gray-900 mb-2">What would you like to do?</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Proceed Anyway:</strong> Create this as a new, separate incident</li>
          <li>• <strong>Cancel:</strong> Review the existing incidents and decide manually</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel & Review
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
        >
          {isSubmitting ? (
            <>
              <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Proceed Anyway'
          )}
        </button>
      </div>
    </div>
  );
};

export default DuplicateAlert;