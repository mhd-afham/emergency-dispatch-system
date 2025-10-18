import React from 'react';

interface ViewDetailsModalProps {
  show: boolean;
  onClose: () => void;
  type: 'vehicle' | 'crew';
  data: any;
}

const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({ show, onClose, type, data }) => {
  if (!show || !data) return null;

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 text-blue-600">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {type === 'vehicle' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {type === 'vehicle' ? 'Vehicle Registration Details' : 'Crew Member Details'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {type === 'vehicle' ? data.registration?.plateNumber : `${data.personal?.firstName} ${data.personal?.lastName}`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            {type === 'vehicle' ? (
              <div className="space-y-6">
                {/* Registration Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Registration Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Plate Number</p>
                      <p className="font-medium text-gray-900">{data.registration?.plateNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Type</p>
                      <p className="font-medium text-gray-900">{data.registration?.vehicleType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Make</p>
                      <p className="font-medium text-gray-900">{data.registration?.make || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Model</p>
                      <p className="font-medium text-gray-900">{data.registration?.model || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Year</p>
                      <p className="font-medium text-gray-900">{data.registration?.year || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Date</p>
                      <p className="font-medium text-gray-900">{formatDate(data.registration?.registrationDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Station Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Station Assignment
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Home Station</p>
                      <p className="font-medium text-gray-900">{data.station?.homeStationId?.name || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Active Status</p>
                      <p className="font-medium text-gray-900">
                        {data.isActive ? (
                          <span className="text-green-600">✓ Active</span>
                        ) : (
                          <span className="text-yellow-600">⏳ Pending Approval</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Operational Status</p>
                      <p className="font-medium text-gray-900 capitalize">{data.status?.operational || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Approval Information */}
                {data.registration?.approvedBy && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approval Details
                    </h4>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Approved By</p>
                          <p className="font-medium text-gray-900">
                            {data.registration.approvedBy.personal?.firstName} {data.registration.approvedBy.personal?.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Approval Date</p>
                          <p className="font-medium text-gray-900">{formatDate(data.registration.approvalDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Registration Status Information */}
                {data.registrationStatus && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Registration Status
                    </h4>
                    <div className={`p-4 rounded-lg ${
                      data.registrationStatus.status === 'approved' ? 'bg-green-50' : 
                      data.registrationStatus.status === 'rejected' ? 'bg-red-50' : 
                      'bg-yellow-50'
                    }`}>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className={`font-medium ${
                            data.registrationStatus.status === 'approved' ? 'text-green-700' : 
                            data.registrationStatus.status === 'rejected' ? 'text-red-700' : 
                            'text-yellow-700'
                          }`}>
                            {data.registrationStatus.status?.toUpperCase() || 'PENDING'}
                          </p>
                        </div>
                        
                        {data.registrationStatus.status === 'approved' && data.registrationStatus.approvedBy && (
                          <>
                            <div>
                              <p className="text-sm text-gray-500">Approved By</p>
                              <p className="font-medium text-gray-900">
                                {data.registrationStatus.approvedBy?.personal?.firstName} {data.registrationStatus.approvedBy?.personal?.lastName}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Approval Date</p>
                              <p className="font-medium text-gray-900">{formatDate(data.registrationStatus.approvedAt)}</p>
                            </div>
                          </>
                        )}
                        
                        {data.registrationStatus.status === 'rejected' && data.registrationStatus.rejectedBy && (
                          <>
                            <div>
                              <p className="text-sm text-gray-500">Rejected By</p>
                              <p className="font-medium text-gray-900">
                                {data.registrationStatus.rejectedBy?.personal?.firstName} {data.registrationStatus.rejectedBy?.personal?.lastName}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Rejection Date</p>
                              <p className="font-medium text-gray-900">{formatDate(data.registrationStatus.rejectedAt)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Reason</p>
                              <p className="font-medium text-gray-900">{data.registrationStatus.rejectionReason || 'No reason provided'}</p>
                            </div>
                          </>
                        )}
                        
                        {data.registrationStatus.notes && (
                          <div>
                            <p className="text-sm text-gray-500">Notes</p>
                            <p className="font-medium text-gray-900">{data.registrationStatus.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Audit Trail
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Created Date</p>
                        <p className="font-medium text-gray-900">{formatDate(data.audit?.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="font-medium text-gray-900">{formatDate(data.audit?.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">First Name</p>
                      <p className="font-medium text-gray-900">{data.personal?.firstName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Name</p>
                      <p className="font-medium text-gray-900">{data.personal?.lastName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Employee ID</p>
                      <p className="font-medium text-gray-900">{data.personal?.employeeId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{data.personal?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{data.personal?.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium text-gray-900">{formatDate(data.personal?.dateOfBirth)}</p>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Professional Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <p className="font-medium text-gray-900">{data.professional?.role || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Certification Level</p>
                      <p className="font-medium text-gray-900">{data.professional?.certificationLevel || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Years of Experience</p>
                      <p className="font-medium text-gray-900">{data.professional?.yearsOfExperience || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hire Date</p>
                      <p className="font-medium text-gray-900">{formatDate(data.professional?.hireDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                {data.personal?.emergencyContact && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Emergency Contact
                    </h4>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium text-gray-900">{data.personal.emergencyContact.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Relationship</p>
                        <p className="font-medium text-gray-900">{data.personal.emergencyContact.relationship || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{data.personal.emergencyContact.phoneNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Active Status</p>
                      <p className="font-medium text-gray-900">
                        {data.settings?.isActive ? (
                          <span className="text-green-600">✓ Active</span>
                        ) : (
                          <span className="text-yellow-600">⏳ Pending Approval</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Registration Status Information */}
                {data.registrationStatus && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Registration Status
                    </h4>
                    <div className={`p-4 rounded-lg ${
                      data.registrationStatus.status === 'approved' ? 'bg-green-50' : 
                      data.registrationStatus.status === 'rejected' ? 'bg-red-50' : 
                      'bg-yellow-50'
                    }`}>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className={`font-medium ${
                            data.registrationStatus.status === 'approved' ? 'text-green-700' : 
                            data.registrationStatus.status === 'rejected' ? 'text-red-700' : 
                            'text-yellow-700'
                          }`}>
                            {data.registrationStatus.status?.toUpperCase() || 'PENDING'}
                          </p>
                        </div>
                        
                        {data.registrationStatus.status === 'approved' && data.registrationStatus.approvedBy && (
                          <>
                            <div>
                              <p className="text-sm text-gray-500">Approved By</p>
                              <p className="font-medium text-gray-900">
                                {data.registrationStatus.approvedBy?.personal?.firstName} {data.registrationStatus.approvedBy?.personal?.lastName}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Approval Date</p>
                              <p className="font-medium text-gray-900">{formatDate(data.registrationStatus.approvedAt)}</p>
                            </div>
                          </>
                        )}
                        
                        {data.registrationStatus.status === 'rejected' && data.registrationStatus.rejectedBy && (
                          <>
                            <div>
                              <p className="text-sm text-gray-500">Rejected By</p>
                              <p className="font-medium text-gray-900">
                                {data.registrationStatus.rejectedBy?.personal?.firstName} {data.registrationStatus.rejectedBy?.personal?.lastName}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Rejection Date</p>
                              <p className="font-medium text-gray-900">{formatDate(data.registrationStatus.rejectedAt)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Reason</p>
                              <p className="font-medium text-gray-900">{data.registrationStatus.rejectionReason || 'No reason provided'}</p>
                            </div>
                          </>
                        )}
                        
                        {data.registrationStatus.notes && (
                          <div>
                            <p className="text-sm text-gray-500">Notes</p>
                            <p className="font-medium text-gray-900">{data.registrationStatus.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Audit Trail
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Created Date</p>
                        <p className="font-medium text-gray-900">{formatDate(data.audit?.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="font-medium text-gray-900">{formatDate(data.audit?.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDetailsModal;
