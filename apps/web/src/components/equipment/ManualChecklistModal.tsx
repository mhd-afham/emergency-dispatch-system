import React from "react";
import { CHECK_ITEMS, getCheckItemsByCategory, CheckItemConfig } from "../../config/checkItemsConfig";

interface ManualChecklistModalProps {
  show: boolean;
  vehicles: any[];
  selectedVehicleId: string;
  checklistValues: Record<string, any>;
  checklistResults: any;
  isSubmitting: boolean;
  onClose: () => void;
  onVehicleChange: (vehicleId: string) => void;
  onValueChange: (itemId: string, value: any) => void;
  onSubmit: () => void;
}

const ManualChecklistModal: React.FC<ManualChecklistModalProps> = ({
  show,
  vehicles,
  selectedVehicleId,
  checklistValues,
  checklistResults,
  isSubmitting,
  onClose,
  onVehicleChange,
  onValueChange,
  onSubmit,
}) => {
  if (!show) return null;

  const categoryGroups = getCheckItemsByCategory();
  const categories = Object.keys(categoryGroups);

  const renderCheckItem = (item: CheckItemConfig) => {
    const value = checklistValues[item.id];
    
    switch (item.type) {
      case 'numeric':
      case 'percentage':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {item.name} {item.critical && <span className="text-red-600">*</span>}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={item.type === 'percentage' ? '1' : '0.1'}
                min={item.passCondition.min || 0}
                max={item.passCondition.max}
                value={value || ''}
                onChange={(e) => onValueChange(item.id, e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`${item.passCondition.min || 0} - ${item.passCondition.max || ''}`}
              />
              <span className="text-sm text-gray-600 w-12">{item.unit}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Pass: {item.passCondition.min || 0} - {item.passCondition.max || '∞'} {item.unit}
            </div>
          </div>
        );

      case 'dropdown':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {item.name} {item.critical && <span className="text-red-600">*</span>}
            </label>
            <select
              value={value || ''}
              onChange={(e) => onValueChange(item.id, e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select --</option>
              {item.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={item.id}
              checked={value || false}
              onChange={(e) => onValueChange(item.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={item.id} className="ml-2 text-sm font-medium text-gray-700">
              {item.name} {item.critical && <span className="text-red-600">*</span>}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                🔧 Manual Equipment Checklist
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Complete all check items to determine vehicle readiness
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Vehicle Selection */}
          <div className="mb-6 bg-white border-2 border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Vehicle <span className="text-red-600">*</span>
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => onVehicleChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value="">-- Select a Vehicle --</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.registration?.plateNumber} - {vehicle.registration?.vehicleType} ({vehicle.status?.operational})
                </option>
              ))}
            </select>
          </div>

          {/* Legend */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <div className="font-semibold text-yellow-800 mb-1">Important Information:</div>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Items marked with <span className="text-red-600 font-bold">*</span> are CRITICAL for vehicle operation</li>
                  <li>If any critical item fails, the vehicle will be marked for MAINTENANCE</li>
                  <li>A maintenance record will be created automatically for failed checks</li>
                  <li>All items must be checked for accurate vehicle status assessment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Check Items by Category */}
          <div className="space-y-6">
            {categories.map((category, idx) => (
              <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    {category}
                    <span className="ml-auto text-xs text-blue-200">
                      {categoryGroups[category].length} items
                    </span>
                  </h4>
                </div>

                {/* Category Items */}
                <div className="bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryGroups[category].map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border ${
                        item.critical
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {renderCheckItem(item)}
                      {item.critical && (
                        <div className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Critical Item
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Results Display */}
          {checklistResults && (
            <div className="mt-6 space-y-4">
              {/* Overall Result */}
              <div className={`border-2 rounded-lg p-6 ${
                checklistResults.overallPass
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {checklistResults.overallPass ? (
                    <>
                      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="text-2xl font-bold text-green-800">CHECKLIST PASSED ✓</div>
                        <div className="text-green-700">Vehicle is ready for service</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="text-2xl font-bold text-red-800">CHECKLIST FAILED ✗</div>
                        <div className="text-red-700">Vehicle marked for maintenance</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Critical Failures */}
                {checklistResults.criticalFailures.length > 0 && (
                  <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-4">
                    <div className="font-bold text-red-800 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Critical Failures ({checklistResults.criticalFailures.length}):
                    </div>
                    <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                      {checklistResults.criticalFailures.map((failure: string, idx: number) => (
                        <li key={idx}>{failure}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {checklistResults.warnings.length > 0 && (
                  <div className="mt-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                    <div className="font-bold text-yellow-800 mb-2">
                      ⚠ Warnings ({checklistResults.warnings.length}):
                    </div>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                      {checklistResults.warnings.map((warning: string, idx: number) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center sticky bottom-0">
          <div className="text-sm text-gray-600">
            {checklistResults ? (
              <span className="font-medium">
                Checklist completed - {checklistResults.overallPass ? 'Vehicle Ready' : 'Maintenance Required'}
              </span>
            ) : (
              <span>
                Fill in all check items and click Submit to evaluate vehicle readiness
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              {checklistResults ? 'Close' : 'Cancel'}
            </button>
            {!checklistResults && (
              <button
                onClick={onSubmit}
                disabled={!selectedVehicleId || isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submit Checklist
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualChecklistModal;
