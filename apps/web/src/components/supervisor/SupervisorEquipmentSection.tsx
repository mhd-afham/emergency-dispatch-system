import React from 'react';
import EquipmentDashboard from '../equipment/EquipmentDashboard';

/**
 * Equipment Management Section for Supervisor Dashboard
 * Owner: Udayanga (Equipment Management & Maintenance)
 * 
 * This component encapsulates all equipment-related functionality
 * for the supervisor dashboard, ensuring clear ownership and
 * reducing merge conflicts with other team members.
 */

interface SupervisorEquipmentSectionProps {
  className?: string;
}

const SupervisorEquipmentSection: React.FC<SupervisorEquipmentSectionProps> = ({ className = '' }) => {
  return (
    <div className={`supervisor-equipment-section ${className}`}>
      {/* Equipment Section Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Equipment Management</h2>
          <p className="text-sm text-gray-600">Vehicle readiness, maintenance, and equipment tracking</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              // Navigate to full equipment page
              window.location.href = '/equipment';
            }}
          >
            View Full Dashboard
          </button>
          <button 
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            onClick={() => {
              console.log('New equipment check');
            }}
          >
            + New Check
          </button>
        </div>
      </div>

      {/* Equipment Dashboard Component */}
      <EquipmentDashboard className="border border-gray-200 rounded-lg" />
      
      {/* Equipment Quick Actions */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <button className="p-3 bg-green-50 border border-green-200 rounded-lg text-center hover:bg-green-100 transition-colors">
          <div className="text-green-600 font-medium text-sm">Critical Alerts</div>
          <div className="text-green-800 text-xs">0 Active</div>
        </button>
        
        <button className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center hover:bg-yellow-100 transition-colors">
          <div className="text-yellow-600 font-medium text-sm">Pending Maintenance</div>
          <div className="text-yellow-800 text-xs">3 Items</div>
        </button>
        
        <button className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center hover:bg-blue-100 transition-colors">
          <div className="text-blue-600 font-medium text-sm">Ready Vehicles</div>
          <div className="text-blue-800 text-xs">12 Units</div>
        </button>
        
        <button className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center hover:bg-purple-100 transition-colors">
          <div className="text-purple-600 font-medium text-sm">Equipment Reports</div>
          <div className="text-purple-800 text-xs">Generate</div>
        </button>
      </div>
    </div>
  );
};

export default SupervisorEquipmentSection;