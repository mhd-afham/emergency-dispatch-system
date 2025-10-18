import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  shiftService, 
  crewService, 
  Shift, 
  CrewMember, 
  CreateShiftForm,
  CrewAssignment,
  UpdateShiftData 
} from '../../services/shifts';

// Types are imported from services/shifts.ts

/**
 * Shift Management Section for Supervisor Dashboard
 * Owner: Spencer (Shift & Scheduling Management)
 * 
 * Implements US-008 (Shift Creation) and US-009 (Crew Assignment)
 * Features:
 * - Create shifts with staffing requirements
 * - Calendar view of shifts
 * - Assign crew members to shifts
 * - Conflict detection and validation
 * - Real-time shift status monitoring
 */

interface SupervisorShiftSectionProps {
  className?: string;
}

const SupervisorShiftSection: React.FC<SupervisorShiftSectionProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'overview' | 'calendar' | 'create' | 'assign'>('overview');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [availableCrew, setAvailableCrew] = useState<CrewMember[]>([]);
  const [allCrew, setAllCrew] = useState<CrewMember[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllCrew, setShowAllCrew] = useState<boolean>(false);
  const [shiftStats, setShiftStats] = useState({
    totalShifts: 0,
    activeShifts: 0,
    fullyStaffed: 0,
    understaffed: 0,
  });
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deleteConfirmShift, setDeleteConfirmShift] = useState<Shift | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Default station ID (in real app, this would come from user context or selection)
  const defaultStationId = "675023b6c3b5d9dab8e67890"; // This should be dynamic

  const [createShiftForm, setCreateShiftForm] = useState<CreateShiftForm>({
    name: '',
    type: 'regular',
    date: selectedDate,
    startTime: '08:00',
    endTime: '16:00',
    requiredCrewCount: 4,
    requiredRoles: [],
    minimumCertificationLevel: 'Basic',
    stationId: defaultStationId,
    supervisorNotes: '',
    recurrence: 'none',
  });

  // Fetch shifts data
  const fetchShifts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await shiftService.getShifts({ limit: 100 });

      if (response && response.success && Array.isArray(response.data)) {
        // Sort safely
        const sorted = [...response.data].sort((a, b) => {
          try {
            const dateA = new Date(a.schedule?.date || 0).getTime();
            const dateB = new Date(b.schedule?.date || 0).getTime();
            return dateB - dateA;
          } catch (e) {
            return 0;
          }
        });
        
        setShifts(sorted);
        calculateShiftStats(sorted);
      } else {
        setShifts([]);
        calculateShiftStats([]);
      }
    } catch (error: any) {
      console.error('Error fetching shifts:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load shifts';
      setError(errorMsg);
      setShifts([]);
      calculateShiftStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate shift statistics
  const calculateShiftStats = (shiftsData: Shift[]) => {
    const stats = {
      totalShifts: shiftsData.length,
      activeShifts: shiftsData.filter(s => s.status.current === 'active').length,
      fullyStaffed: shiftsData.filter(s => s.staffing.assignedCrew.length >= s.staffing.requiredCrewCount).length,
      understaffed: shiftsData.filter(s => s.staffing.assignedCrew.length < s.staffing.requiredCrewCount).length,
    };
    setShiftStats(stats);
  };

  // Create new shift
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 FORM SUBMITTED');
    console.log('📋 Editing shift?:', !!editingShift);
    console.log('📋 Form data:', createShiftForm);
    
    try {
      setLoading(true);
      setError(null);

      let response;
      if (editingShift) {
        // Update existing shift - Transform data to match backend's nested format
        console.log('✏️ UPDATING shift:', editingShift._id);
        
        const updateData = {
          shift: {
            name: createShiftForm.name,
            type: createShiftForm.type,
          },
          schedule: {
            startTime: createShiftForm.startTime,
            endTime: createShiftForm.endTime,
            recurrence: createShiftForm.recurrence,
          },
          staffing: {
            requiredCrewCount: createShiftForm.requiredCrewCount,
            requiredRoles: createShiftForm.requiredRoles,
            minimumCertificationLevel: createShiftForm.minimumCertificationLevel,
          },
          supervision: {
            supervisorNotes: createShiftForm.supervisorNotes || '',
          }
        };
        
        console.log('✏️ Transformed update data:', updateData);
        response = await shiftService.updateShift(editingShift._id, updateData);
        console.log('✅ Update response:', response);
      } else {
        // Create new shift - Use flat format which backend POST expects
        console.log('➕ CREATING new shift');
        response = await shiftService.createShift(createShiftForm);
        console.log('✅ Create response:', response);
      }

      if (response.success) {
        const message = editingShift ? '✅ Shift updated successfully!' : '✅ Shift created successfully!';
        console.log('✅ Success:', message);
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
        setActiveView('overview');
        setEditingShift(null);
        fetchShifts();
        // Reset form
        setCreateShiftForm({
          name: '',
          type: 'regular',
          date: selectedDate,
          startTime: '08:00',
          endTime: '16:00',
          requiredCrewCount: 4,
          requiredRoles: [],
          minimumCertificationLevel: 'Basic',
          stationId: defaultStationId,
          supervisorNotes: '',
          recurrence: 'none',
        });
      }
    } catch (error: any) {
      console.error('Error saving shift:', error);
      setError(error.response?.data?.message || 'Failed to save shift');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available crew for a shift
  const fetchAvailableCrew = async (shiftId: string) => {
    try {
      setLoading(true);
      const response = await shiftService.getAvailableCrew(shiftId);

      if (response.success) {
        setAvailableCrew(response.data.availableCrew);
      }
      
      // Also fetch ALL crew members
      const allCrewResponse = await crewService.getCrew({ limit: 1000, isActive: true });
      if (allCrewResponse.success) {
        setAllCrew(allCrewResponse.data.crewMembers || []);
      }
    } catch (error: any) {
      console.error('Error fetching available crew:', error);
      setError(error.response?.data?.message || 'Failed to fetch available crew');
    } finally {
      setLoading(false);
    }
  };

  // Assign crew to shift
  const handleAssignCrew = async (crewId: string, role: string) => {
    if (!selectedShift) {
      console.error('❌ No shift selected');
      return;
    }

    console.log('🔄 Assigning crew:', { crewId, role, shiftId: selectedShift._id });

    try {
      setLoading(true);
      setError(null);
      
      const response = await shiftService.assignCrew(selectedShift._id, [{ crewId, role }]);
      console.log('✅ Assignment response:', response);

      if (response.success) {
        // Show success message
        setSuccessMessage(`✅ Crew member assigned successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Refresh the shift details
        const shiftResponse = await shiftService.getShift(selectedShift._id);
        if (shiftResponse.success) {
          setSelectedShift(shiftResponse.data);
        }
        
        // Refresh lists
        fetchShifts();
        fetchAvailableCrew(selectedShift._id);
      }
    } catch (error: any) {
      console.error('❌ Error assigning crew:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to assign crew member';
      setError(errorMsg);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Remove crew from shift
  const handleRemoveCrew = async (crewId: string) => {
    if (!selectedShift) {
      console.error('❌ No shift selected');
      return;
    }

    console.log('🔄 Removing crew:', { crewId, shiftId: selectedShift._id });

    try {
      setLoading(true);
      setError(null);
      
      const response = await shiftService.removeCrew(selectedShift._id, crewId);
      console.log('✅ Remove response:', response);

      if (response.success) {
        // Show success message
        setSuccessMessage('✅ Crew member removed successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Refresh the shift details
        const shiftResponse = await shiftService.getShift(selectedShift._id);
        if (shiftResponse.success) {
          setSelectedShift(shiftResponse.data);
        }
        
        // Refresh lists
        fetchShifts();
        fetchAvailableCrew(selectedShift._id);
      }
    } catch (error: any) {
      console.error('❌ Error removing crew:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to remove crew member';
      setError(errorMsg);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete shift
  const handleDeleteShift = async () => {
    if (!deleteConfirmShift) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      const response = await shiftService.deleteShift(deleteConfirmShift._id);
      
      if (response.success) {
        setSuccessMessage('✅ Shift deleted successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        setDeleteConfirmShift(null);
        fetchShifts();
      }
    } catch (error: any) {
      console.error('Error deleting shift:', error);
      setError(error.response?.data?.message || 'Failed to delete shift');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit shift
  const handleEditShift = (shift: Shift) => {
    console.log('🔍 EDIT BUTTON CLICKED');
    console.log('📋 Full shift object:', JSON.stringify(shift, null, 2));
    
    if (!shift || !shift._id) {
      setError('Invalid shift data');
      console.error('❌ Shift is null or missing _id');
      return;
    }

    try {
      setEditingShift(shift);
      setError(null);
      
      // Extract date safely
      let dateValue = selectedDate;
      if (shift.schedule && shift.schedule.date) {
        try {
          dateValue = shift.schedule.date.split('T')[0];
          console.log('✅ Extracted date:', dateValue);
        } catch (e) {
          console.warn('⚠️ Could not parse date, using default:', e);
        }
      }

      // Extract values with detailed logging
      const shiftName = (shift.shift && shift.shift.name) || '';
      const shiftType = (shift.shift && shift.shift.type) || 'regular';
      const startTime = (shift.schedule && shift.schedule.startTime) || '08:00';
      const endTime = (shift.schedule && shift.schedule.endTime) || '16:00';
      const crewCount = (shift.staffing && shift.staffing.requiredCrewCount) || 4;
      const roles = (shift.staffing && shift.staffing.requiredRoles) || [];
      const certLevel = (shift.staffing && shift.staffing.minimumCertificationLevel) || 'Basic';
      const station = (shift.stationId && shift.stationId._id) || defaultStationId;
      const recurrence = (shift.schedule && shift.schedule.recurrence) || 'none';

      console.log('📝 Form values being set:');
      console.log('  - Name:', shiftName);
      console.log('  - Type:', shiftType);
      console.log('  - Date:', dateValue);
      console.log('  - Start Time:', startTime);
      console.log('  - End Time:', endTime);
      console.log('  - Crew Count:', crewCount);
      console.log('  - Roles:', roles);
      console.log('  - Cert Level:', certLevel);
      console.log('  - Station ID:', station);
      console.log('  - Recurrence:', recurrence);
      
      const formData = {
        name: shiftName,
        type: shiftType,
        date: dateValue,
        startTime: startTime,
        endTime: endTime,
        requiredCrewCount: crewCount,
        requiredRoles: roles,
        minimumCertificationLevel: certLevel,
        stationId: station,
        supervisorNotes: '',
        recurrence: recurrence,
      };

      console.log('📋 Setting form data:', formData);
      setCreateShiftForm(formData);
      
      console.log('✅ Switching to create view');
      setActiveView('create');
      
      // Force a small delay to ensure state updates
      setTimeout(() => {
        console.log('📋 Current form state after delay:', createShiftForm);
      }, 100);
      
    } catch (error: any) {
      console.error('❌ Error editing shift:', error);
      setError('Could not prepare edit form: ' + error.message);
    }
  };

  // Filter crew members based on search and role
  const getFilteredCrew = (crewList: CrewMember[]) => {
    let filtered = crewList;
    
    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(crew => crew.professional.role === selectedRole);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(crew => 
        crew.personal.firstName.toLowerCase().includes(query) ||
        crew.personal.lastName.toLowerCase().includes(query) ||
        crew.personal.employeeId.toLowerCase().includes(query) ||
        crew.professional.role.toLowerCase().includes(query) ||
        crew.professional.certificationLevel.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Get unique roles from all crew
  const getUniqueRoles = () => {
    const roles = new Set<string>();
    allCrew.forEach(crew => roles.add(crew.professional.role));
    return Array.from(roles).sort();
  };

  // Handle manage shift crew
  const handleManageShift = async (shift: Shift) => {
    if (!shift || !shift._id) {
      setError('Invalid shift data');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch complete shift details
      const response = await shiftService.getShift(shift._id);
      
      if (response && response.success && response.data) {
        setSelectedShift(response.data);
        setActiveView('assign');
        // Fetch available crew
        fetchAvailableCrew(shift._id).catch(err => {
          console.error('Error fetching crew:', err);
        });
      } else {
        setError('Could not load shift details');
      }
    } catch (error: any) {
      console.error('Error managing shift:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load shift';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Get shifts for selected date
  const getShiftsForDate = (date: string) => {
    return shifts.filter(shift => 
      shift.schedule.date.split('T')[0] === date
    );
  };

  // Generate week days for calendar view
  const getWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day.toISOString().split('T')[0]);
    }
    return days;
  };

  // Get status color class
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'planned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get staffing status color
  const getStaffingColor = (assigned: number, required: number) => {
    const percentage = (assigned / required) * 100;
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Load shifts on component mount and when date changes
  useEffect(() => {
    fetchShifts();
  }, [selectedDate]);

  // Update form date when selected date changes
  useEffect(() => {
    setCreateShiftForm(prev => ({ ...prev, date: selectedDate }));
  }, [selectedDate]);

  const roles = ['EMT', 'Paramedic', 'Firefighter', 'Driver', 'Supervisor'];
  const certificationLevels = ['Basic', 'Intermediate', 'Advanced', 'Expert'];
  const shiftTypes = [
    { value: 'regular', label: 'Regular' },
    { value: 'overtime', label: 'Overtime' },
    { value: 'emergency', label: 'Emergency' },
  ];

  return (
    <div className={`supervisor-shift-section ${className}`}>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg animate-fade-in">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-500 rounded-full mr-3 shadow-md">
              <span className="text-2xl">✓</span>
            </div>
            <div className="flex-1">
              <div className="text-green-900 text-sm font-bold mb-1">Success!</div>
              <div className="text-green-800 text-sm font-medium">{successMessage}</div>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="ml-auto w-8 h-8 flex items-center justify-center text-green-600 hover:text-white hover:bg-green-600 rounded-full transition-all duration-200 font-bold text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-400 rounded-xl shadow-lg animate-fade-in">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-full mr-3 shadow-md">
              <span className="text-2xl text-white">✕</span>
            </div>
            <div className="flex-1">
              <div className="text-red-900 text-sm font-bold mb-1">Error!</div>
              <div className="text-red-800 text-sm font-medium">{error}</div>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto w-8 h-8 flex items-center justify-center text-red-600 hover:text-white hover:bg-red-600 rounded-full transition-all duration-200 font-bold text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmShift && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in border-2 border-red-200">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto mb-4 shadow-lg">
                <span className="text-5xl text-white">⚠</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Delete Shift?</h3>
              <p className="text-gray-700 mb-4 text-base">
                Are you sure you want to delete <strong className="text-red-600">"{deleteConfirmShift.shift.name}"</strong>?
              </p>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 mb-4 shadow-sm">
                <p className="text-sm text-gray-800 font-medium space-y-1">
                  <span className="block">📅 {new Date(deleteConfirmShift.schedule.date).toLocaleDateString()}</span>
                  <span className="block">⏰ {deleteConfirmShift.schedule.startTime} - {deleteConfirmShift.schedule.endTime}</span>
                  <span className="block">👥 {deleteConfirmShift.staffing.assignedCrew.length} crew members assigned</span>
                </p>
              </div>
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3">
                <p className="text-red-700 text-sm font-bold flex items-center justify-center">
                  <span className="text-lg mr-2">⚠️</span>
                  This action cannot be undone!
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirmShift(null)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3.5 bg-white border-2 border-gray-400 text-gray-800 rounded-xl hover:border-gray-600 hover:bg-gray-50 font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm"
              >
                ✕ Cancel
              </button>
              <button
                onClick={handleDeleteShift}
                disabled={isDeleting}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl hover:from-red-600 hover:to-red-800 font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm"
              >
                {isDeleting ? '⏳ Deleting...' : '🗑️ Delete Shift'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shift Management</h2>
          <p className="text-sm text-gray-600">Staff scheduling, shift coverage, and crew assignments</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 text-sm font-medium rounded transition-all duration-200 ${
              activeView === 'overview'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-4 py-2 text-sm font-medium rounded transition-all duration-200 ${
              activeView === 'calendar'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => {
              setActiveView('create');
              setEditingShift(null);
            }}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200"
          >
            + New Shift
          </button>
        </div>
      </div>

      {/* Overview View */}
      {activeView === 'overview' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{shiftStats.totalShifts}</div>
              <div className="text-sm text-blue-600">Total Shifts</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{shiftStats.activeShifts}</div>
              <div className="text-sm text-green-600">Active Now</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{shiftStats.fullyStaffed}</div>
              <div className="text-sm text-green-600">Fully Staffed</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{shiftStats.understaffed}</div>
              <div className="text-sm text-red-600">Need Staff</div>
            </div>
          </div>

          {/* All Shifts */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Shifts</h3>
            </div>
            <div>
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-pulse">Loading shifts from database...</div>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-600">
                  <p className="font-semibold">Error loading shifts</p>
                  <p className="text-sm mt-2">{error}</p>
                  <button 
                    onClick={fetchShifts}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : shifts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="font-semibold">No shifts found in database</p>
                  <p className="text-sm mt-2">Create a new shift to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Shift Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Date & Time</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Staffing</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.map((shift) => (
                        <tr key={shift._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{shift.shift?.name || 'Unnamed Shift'}</div>
                            <div className="text-sm text-gray-500">{shift.stationId?.name || 'No station assigned'}</div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            <div>{shift.schedule?.date ? new Date(shift.schedule.date).toLocaleDateString() : 'No date'}</div>
                            <div>{shift.schedule?.startTime || '00:00'} - {shift.schedule?.endTime || '00:00'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              shift.shift?.type === 'emergency' ? 'bg-red-100 text-red-600' : 
                              shift.shift?.type === 'overtime' ? 'bg-yellow-100 text-yellow-600' : 
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {shift.shift?.type?.toUpperCase() || 'REGULAR'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shift.status?.current || 'planned')}`}>
                              {shift.status?.current?.toUpperCase() || 'PLANNED'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <span className={getStaffingColor(shift.staffing?.assignedCrew?.length || 0, shift.staffing?.requiredCrewCount || 0)}>
                                ✓ {shift.staffing?.assignedCrew?.length || 0}/{shift.staffing?.requiredCrewCount || 0}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleManageShift(shift)}
                                disabled={loading}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Manage crew"
                              >
                                Manage
                              </button>
                              <button
                                onClick={() => handleEditShift(shift)}
                                disabled={loading}
                                className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit shift"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteConfirmShift(shift)}
                                className="px-3 py-1 text-xs text-red-600 hover:text-red-900"
                                title="Delete shift"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Weekly Schedule</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
              {getWeekDays().map(date => {
                const dayShifts = getShiftsForDate(date);
                return (
                  <div key={date} className="min-h-[120px] border border-gray-200 rounded p-1">
                    <div className="text-xs text-gray-600 mb-1">
                      {new Date(date).getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayShifts.map(shift => (
                        <div
                          key={shift._id}
                          className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200"
                          onClick={() => handleManageShift(shift)}
                        >
                          <div className="font-medium truncate">{shift.shift.name}</div>
                          <div>{shift.schedule.startTime}</div>
                          <div className={getStaffingColor(shift.staffing.assignedCrew.length, shift.staffing.requiredCrewCount)}>
                            {shift.staffing.assignedCrew.length}/{shift.staffing.requiredCrewCount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Shift View */}
      {activeView === 'create' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {editingShift ? '✏️ Edit Shift' : '➕ Create New Shift'}
              </h3>
              <p className="text-sm text-gray-500">
                {editingShift ? 'Update shift details below' : 'Fill in the details to create a new shift'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveView('overview');
                setEditingShift(null);
                setCreateShiftForm({
                  name: '',
                  type: 'regular',
                  date: selectedDate,
                  startTime: '08:00',
                  endTime: '16:00',
                  requiredCrewCount: 4,
                  requiredRoles: [],
                  minimumCertificationLevel: 'Basic',
                  stationId: defaultStationId,
                  supervisorNotes: '',
                  recurrence: 'none',
                });
              }}
              className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreateShift} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift Name *
                </label>
                <input
                  type="text"
                  value={createShiftForm.name}
                  onChange={(e) => setCreateShiftForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., Day Shift - Station 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift Type
                </label>
                <select
                  value={createShiftForm.type}
                  onChange={(e) => setCreateShiftForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {shiftTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={createShiftForm.date}
                  onChange={(e) => setCreateShiftForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Crew Count *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={createShiftForm.requiredCrewCount}
                  onChange={(e) => setCreateShiftForm(prev => ({ ...prev, requiredCrewCount: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={createShiftForm.startTime}
                  onChange={(e) => setCreateShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  value={createShiftForm.endTime}
                  onChange={(e) => setCreateShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Roles
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {roles.map(role => (
                  <label key={role} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={createShiftForm.requiredRoles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCreateShiftForm(prev => ({
                            ...prev,
                            requiredRoles: [...prev.requiredRoles, role]
                          }));
                        } else {
                          setCreateShiftForm(prev => ({
                            ...prev,
                            requiredRoles: prev.requiredRoles.filter(r => r !== role)
                          }));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Certification Level
              </label>
              <select
                value={createShiftForm.minimumCertificationLevel}
                onChange={(e) => setCreateShiftForm(prev => ({ ...prev, minimumCertificationLevel: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {certificationLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supervisor Notes
              </label>
              <textarea
                value={createShiftForm.supervisorNotes}
                onChange={(e) => setCreateShiftForm(prev => ({ ...prev, supervisorNotes: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="Optional notes about this shift..."
              />
            </div>

            <div className="flex space-x-4 pt-6 border-t border-gray-200 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editingShift ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {editingShift ? '✅ Update Shift' : '➕ Create Shift'}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('overview');
                  setEditingShift(null);
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Crew Assignment View */}
      {activeView === 'assign' && selectedShift && (
        <div className="space-y-6">
          {/* Shift Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedShift.shift?.name || 'Shift Details'}</h3>
                {selectedShift.schedule && (
                  <p className="text-sm text-gray-600">
                    {new Date(selectedShift.schedule.date).toLocaleDateString()} • {selectedShift.schedule.startTime} - {selectedShift.schedule.endTime}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Station: {selectedShift.stationId?.name || 'Not assigned'}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveView('overview');
                  setSelectedShift(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                ← Back
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{selectedShift.staffing?.requiredCrewCount || 0}</div>
                <div className="text-sm text-blue-600">Required</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{selectedShift.staffing?.assignedCrew?.length || 0}</div>
                <div className="text-sm text-green-600">Assigned</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">
                  {(selectedShift.staffing?.requiredCrewCount || 0) - (selectedShift.staffing?.assignedCrew?.length || 0)}
                </div>
                <div className="text-sm text-yellow-600">Needed</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Currently Assigned Crew */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">✅ Assigned Crew ({selectedShift.staffing?.assignedCrew?.length || 0})</h4>
              </div>
              <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                {!selectedShift.staffing?.assignedCrew || selectedShift.staffing.assignedCrew.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="text-3xl mb-2">👥</div>
                    <div>No crew assigned yet</div>
                    <div className="text-xs mt-1">Start adding crew members from the right panel</div>
                  </div>
                ) : (
                  selectedShift.staffing.assignedCrew.map((assignment) => (
                    <div key={assignment._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-gray-900">
                              {assignment.crewId.personal.firstName} {assignment.crewId.personal.lastName}
                            </div>
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              {assignment.crewId.personal.employeeId}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">Role:</span>
                              <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded">
                                {assignment.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">Specialization:</span>
                              <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                                {assignment.crewId.professional.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">Certification:</span>
                              <span className="text-xs text-gray-600">
                                {assignment.crewId.professional.certificationLevel}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCrew(assignment.crewId._id)}
                          disabled={loading}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Available Crew Panel */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">
                    {showAllCrew ? '👥 All Crew Members' : '✨ Available Crew'}
                  </h4>
                  <button
                    onClick={() => setShowAllCrew(!showAllCrew)}
                    className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-all"
                  >
                    {showAllCrew ? 'Show Available Only' : 'Show All Crew'}
                  </button>
                </div>
                
                {/* Search and Filters */}
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="🔍 Search by name, employee ID, role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Specializations</option>
                    {getUniqueRoles().map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <div>Loading crew members...</div>
                  </div>
                ) : (() => {
                  const crewToShow = showAllCrew ? allCrew : availableCrew;
                  const filteredCrew = getFilteredCrew(crewToShow);
                  const alreadyAssignedIds = (selectedShift.staffing?.assignedCrew || []).map(a => a.crewId._id);
                  const availableToAssign = filteredCrew.filter(crew => !alreadyAssignedIds.includes(crew._id));
                  
                  if (filteredCrew.length === 0) {
                    return (
                      <div className="p-6 text-center text-gray-500">
                        <div className="text-3xl mb-2">🔍</div>
                        <div>No crew members found</div>
                        <div className="text-xs mt-1">Try adjusting your filters</div>
                      </div>
                    );
                  }
                  
                  if (availableToAssign.length === 0) {
                    return (
                      <div className="p-6 text-center text-gray-500">
                        <div className="text-3xl mb-2">✅</div>
                        <div>All matching crew already assigned</div>
                      </div>
                    );
                  }
                  
                  return availableToAssign.map((crew) => {
                    const isAvailable = crew.currentStatus.availability === 'available' || crew.currentStatus.availability === 'off_duty';
                    
                    return (
                      <div key={crew._id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <div className="font-medium text-gray-900">
                                {crew.personal.firstName} {crew.personal.lastName}
                              </div>
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                {crew.personal.employeeId}
                              </span>
                              {!isAvailable && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                  {crew.currentStatus.availability}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-700">Specialization:</span>
                                <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                                  {crew.professional.role}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-700">Certification:</span>
                                <span className="text-xs text-gray-600">
                                  {crew.professional.certificationLevel}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-700">Status:</span>
                                <span className={`text-xs font-medium ${isAvailable ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {crew.currentStatus.availability}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAssignCrew(crew._id, crew.professional.role)}
                            disabled={loading}
                            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap"
                          >
                            + Assign
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorShiftSection;