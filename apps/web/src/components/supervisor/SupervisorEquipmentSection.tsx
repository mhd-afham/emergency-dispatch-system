import React from 'react';
import EquipmentManagementDashboard from '../equipment/EquipmentManagementDashboard';

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
      {/* Comprehensive Equipment Management Dashboard */}
      <EquipmentManagementDashboard />
    </div>
  );
};

export default SupervisorEquipmentSection;