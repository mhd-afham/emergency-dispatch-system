import React, { useState } from 'react';

/**
 * Shift Management Section for Supervisor Dashboard
 * Owner: Spencer (Shift & Scheduling Management)
 * 
 * This component encapsulates all shift-related functionality
 * for the supervisor dashboard, ensuring clear ownership and
 * reducing merge conflicts with other team members.
 * 
 * NOTE: This is a placeholder component for Spencer to implement
 * his shift management features independently.
 */

interface SupervisorShiftSectionProps {
  className?: string;
}

const SupervisorShiftSection: React.FC<SupervisorShiftSectionProps> = ({ className = '' }) => {
  // Placeholder state - Spencer can replace with actual shift data
  const [shiftOverview] = useState({
    currentShift: "Day Shift (06:00 - 18:00)",
    totalStaff: 24,
    onDuty: 22,
    onBreak: 2,
    nextShift: "Night Shift (18:00 - 06:00)",
    nextShiftStaff: 18,
  });

  return (
    <div className={`supervisor-shift-section ${className}`}>
      {/* Shift Section Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shift Management</h2>
          <p className="text-sm text-gray-600">Staff scheduling, shift coverage, and crew assignments</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => {
              console.log('Navigate to full shift dashboard');
            }}
          >
            Manage Shifts
          </button>
          <button 
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            onClick={() => {
              console.log('Create new shift');
            }}
          >
            + New Shift
          </button>
        </div>
      </div>

      {/* Shift Overview Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 border rounded-lg bg-blue-50">
            <div className="text-2xl font-bold text-blue-600">{shiftOverview.totalStaff}</div>
            <div className="text-sm text-blue-600">Total Staff</div>
          </div>
          <div className="text-center p-4 border rounded-lg bg-green-50">
            <div className="text-2xl font-bold text-green-600">{shiftOverview.onDuty}</div>
            <div className="text-sm text-green-600">On Duty</div>
          </div>
          <div className="text-center p-4 border rounded-lg bg-yellow-50">
            <div className="text-2xl font-bold text-yellow-600">{shiftOverview.onBreak}</div>
            <div className="text-sm text-yellow-600">On Break</div>
          </div>
          <div className="text-center p-4 border rounded-lg bg-purple-50">
            <div className="text-2xl font-bold text-purple-600">{shiftOverview.nextShiftStaff}</div>
            <div className="text-sm text-purple-600">Next Shift Ready</div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600 border-t pt-4">
          <p><strong>Current:</strong> {shiftOverview.currentShift}</p>
          <p><strong>Upcoming:</strong> {shiftOverview.nextShift}</p>
        </div>
      </div>

      {/* Shift Quick Actions */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <button className="p-3 bg-green-50 border border-green-200 rounded-lg text-center hover:bg-green-100 transition-colors">
          <div className="text-green-600 font-medium text-sm">Coverage Status</div>
          <div className="text-green-800 text-xs">100% Covered</div>
        </button>
        
        <button className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center hover:bg-orange-100 transition-colors">
          <div className="text-orange-600 font-medium text-sm">Pending Requests</div>
          <div className="text-orange-800 text-xs">2 Requests</div>
        </button>
        
        <button className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center hover:bg-blue-100 transition-colors">
          <div className="text-blue-600 font-medium text-sm">Schedule Conflicts</div>
          <div className="text-blue-800 text-xs">0 Conflicts</div>
        </button>
        
        <button className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-center hover:bg-indigo-100 transition-colors">
          <div className="text-indigo-600 font-medium text-sm">Shift Reports</div>
          <div className="text-indigo-800 text-xs">Generate</div>
        </button>
      </div>

      {/* TODO for Spencer */}
      <div className="mt-4 p-4 bg-gray-50 border-l-4 border-blue-500 rounded">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-gray-700">
              <strong>For Spencer:</strong> This is your dedicated space for shift management features. 
              You can implement your US-008 (Shift Creation) and US-009 (Crew Assignment) functionality here 
              without conflicts with Udayanga's equipment management work.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorShiftSection;