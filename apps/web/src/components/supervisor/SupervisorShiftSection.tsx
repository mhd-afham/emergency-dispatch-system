import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  shiftService, 
  crewService, 
  Shift, 
  CrewMember, 
  CreateShiftForm,
  CrewAssignment 
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
  const [shiftStats, setShiftStats] = useState({
    totalShifts: 0,
    activeShifts: 0,
    fullyStaffed: 0,
    understaffed: 0,
  });

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
    try {
      setLoading(true);
      setError(null);
      
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const response = await shiftService.getShifts({
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0],
        stationId: defaultStationId,
      });

      if (response.success) {
        setShifts(response.data);
        calculateShiftStats(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching shifts:', error);
      setError(error.response?.data?.message || 'Failed to fetch shifts');
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
    try {
      setLoading(true);
      setError(null);

      const response = await shiftService.createShift(createShiftForm);

      if (response.success) {
        setActiveView('overview');
        fetchShifts();
        // Reset form
        setCreateShiftForm({
          ...createShiftForm,
          name: '',
          supervisorNotes: '',
        });
      }
    } catch (error: any) {
      console.error('Error creating shift:', error);
      setError(error.response?.data?.message || 'Failed to create shift');
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
    } catch (error: any) {
      console.error('Error fetching available crew:', error);
      setError(error.response?.data?.message || 'Failed to fetch available crew');
    } finally {
      setLoading(false);
    }
  };

  // Assign crew to shift
  const handleAssignCrew = async (crewId: string, role: string) => {
    if (!selectedShift) return;

    try {
      setLoading(true);
      const response = await shiftService.assignCrew(selectedShift._id, [{ crewId, role }]);

      if (response.success) {
        fetchShifts();
        fetchAvailableCrew(selectedShift._id);
        // Update selected shift
        const updatedShift = response.data;
        setSelectedShift(updatedShift);
      }
    } catch (error: any) {
      console.error('Error assigning crew:', error);
      setError(error.response?.data?.message || 'Failed to assign crew member');
    } finally {
      setLoading(false);
    }
  };

  // Remove crew from shift
  const handleRemoveCrew = async (crewId: string) => {
    if (!selectedShift) return;

    try {
      setLoading(true);
      const response = await shiftService.removeCrew(selectedShift._id, crewId);

      if (response.success) {
        fetchShifts();
        fetchAvailableCrew(selectedShift._id);
        // Update selected shift by refetching it
        const shiftResponse = await shiftService.getShift(selectedShift._id);
        if (shiftResponse.success) {
          setSelectedShift(shiftResponse.data);
        }
      }
    } catch (error: any) {
      console.error('Error removing crew:', error);
      setError(error.response?.data?.message || 'Failed to remove crew member');
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
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="text-red-800 text-sm">{error}</div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shift Management</h2>
          <p className="text-sm text-gray-600">Staff scheduling, shift coverage, and crew assignments</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-3 py-1.5 text-sm rounded ${
              activeView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-3 py-1.5 text-sm rounded ${
              activeView === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            📅 Calendar
          </button>
          <button
            onClick={() => setActiveView('create')}
            className={`px-3 py-1.5 text-sm rounded ${
              activeView === 'create'
                ? 'bg-green-600 text-white'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            + Create Shift
          </button>
        </div>
      </div>

      {/* Overview View */}
      {activeView === 'overview' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{shiftStats.totalShifts}</div>
              <div className="text-sm text-blue-600">Total Shifts</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{shiftStats.activeShifts}</div>
              <div className="text-sm text-green-600">Active Now</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-600">{shiftStats.fullyStaffed}</div>
              <div className="text-sm text-emerald-600">Fully Staffed</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{shiftStats.understaffed}</div>
              <div className="text-sm text-red-600">Need Staff</div>
            </div>
          </div>

          {/* Recent Shifts */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Shifts</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading shifts...</div>
              ) : shifts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No shifts found for this week.</div>
              ) : (
                shifts.slice(0, 5).map((shift) => (
                  <div key={shift._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{shift.shift.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(shift.status.current)}`}>
                            {shift.status.current}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(shift.schedule.date).toLocaleDateString()} • {shift.schedule.startTime} - {shift.schedule.endTime}
                        </div>
                        <div className="text-sm">
                          <span className={getStaffingColor(shift.staffing.assignedCrew.length, shift.staffing.requiredCrewCount)}>
                            {shift.staffing.assignedCrew.length}/{shift.staffing.requiredCrewCount} staff assigned
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedShift(shift);
                            setActiveView('assign');
                            fetchAvailableCrew(shift._id);
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Manage Crew
                        </button>
                      </div>
                    </div>
                  </div>
                ))
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
                          onClick={() => {
                            setSelectedShift(shift);
                            setActiveView('assign');
                            fetchAvailableCrew(shift._id);
                          }}
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

      {/* Create Shift View */}
      {activeView === 'create' && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Create New Shift</h3>
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

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Shift'}
              </button>
              <button
                type="button"
                onClick={() => setActiveView('overview')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
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
                <h3 className="text-lg font-medium text-gray-900">{selectedShift.shift.name}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(selectedShift.schedule.date).toLocaleDateString()} • {selectedShift.schedule.startTime} - {selectedShift.schedule.endTime}
                </p>
                <p className="text-sm text-gray-600">
                  Station: {selectedShift.stationId.name}
                </p>
              </div>
              <button
                onClick={() => setActiveView('overview')}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
              >
                ← Back
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-600">{selectedShift.staffing.requiredCrewCount}</div>
                <div className="text-sm text-blue-600">Required</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">{selectedShift.staffing.assignedCrew.length}</div>
                <div className="text-sm text-green-600">Assigned</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded">
                <div className="text-lg font-bold text-orange-600">
                  {selectedShift.staffing.requiredCrewCount - selectedShift.staffing.assignedCrew.length}
                </div>
                <div className="text-sm text-orange-600">Needed</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Currently Assigned Crew */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Assigned Crew</h4>
              </div>
              <div className="divide-y divide-gray-200">
                {selectedShift.staffing.assignedCrew.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No crew assigned yet</div>
                ) : (
                  selectedShift.staffing.assignedCrew.map((assignment) => (
                    <div key={assignment._id} className="p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {assignment.crewId.personal.firstName} {assignment.crewId.personal.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {assignment.role} • {assignment.crewId.personal.employeeId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.crewId.professional.certificationLevel} • {assignment.crewId.professional.role}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCrew(assignment.crewId._id)}
                        disabled={loading}
                        className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Available Crew */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Available Crew</h4>
              </div>
              <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading available crew...</div>
                ) : availableCrew.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No available crew found</div>
                ) : (
                  availableCrew.map((crew) => (
                    <div key={crew._id} className="p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {crew.personal.firstName} {crew.personal.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {crew.professional.role} • {crew.personal.employeeId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {crew.professional.certificationLevel} • {crew.currentStatus.availability}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignCrew(crew._id, crew.professional.role)}
                        disabled={loading || selectedShift.staffing.assignedCrew.length >= selectedShift.staffing.requiredCrewCount}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorShiftSection;