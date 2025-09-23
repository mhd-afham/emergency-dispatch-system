import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createIncident, CreateIncidentData, DuplicateWarning } from '../../services/incidents';
import IncidentForm from './IncidentForm';
import DuplicateAlert from './DuplicateAlert';

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (incidentId: string) => void;
}

const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[]>([]);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [pendingIncidentData, setPendingIncidentData] = useState<CreateIncidentData | null>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (incidentData: CreateIncidentData) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await createIncident(incidentData);
      
      if (response.data.duplicateWarnings && response.data.duplicateWarnings.length > 0) {
        setDuplicateWarnings(response.data.duplicateWarnings);
        setPendingIncidentData(incidentData);
        setShowDuplicateAlert(true);
      } else {
        onSuccess(response.data.incident.incidentId);
        handleClose();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateConfirm = async () => {
    if (!pendingIncidentData) return;

    setIsSubmitting(true);
    try {
      const response = await createIncident(pendingIncidentData);
      onSuccess(response.data.incident.incidentId);
      handleClose();
    } catch (error: any) {
      setError(error.message || 'Failed to create incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateCancel = () => {
    setShowDuplicateAlert(false);
    setDuplicateWarnings([]);
    setPendingIncidentData(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError('');
      setDuplicateWarnings([]);
      setShowDuplicateAlert(false);
      setPendingIncidentData(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Log Emergency Call
              </h3>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showDuplicateAlert ? (
              <DuplicateAlert
                warnings={duplicateWarnings}
                onConfirm={handleDuplicateConfirm}
                onCancel={handleDuplicateCancel}
                isSubmitting={isSubmitting}
              />
            ) : (
              <IncidentForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                onCancel={handleClose}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateIncidentModal;