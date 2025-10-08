import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import SupervisorEquipmentSection from "../components/SupervisorEquipmentSection";
import SupervisorShiftSection from "../components/supervisor/SupervisorShiftSection";
import { analyticsService, AnalyticsSummary } from "../services/analytics";

/**
 * Modular Supervisor Dashboard
 * 
 * This dashboard uses a component-based architecture to prevent merge conflicts
 * between team members working on different functional areas:
 * 
 * - Udayanga: Equipment Management (SupervisorEquipmentSection)
 * - Spencer: Shift Management (SupervisorShiftSection)
 * 
 * Each team member owns their section component and can develop independently.
 */

interface AnalyticsCard {
  title: string;
  value: string;
  icon: string;
  status: string;
}

const ModularSupervisorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'equipment' | 'shifts'>('overview');
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsCard[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real-time analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data: AnalyticsSummary = await analyticsService.getSummary();
        
        // Store full analytics data
        setAnalyticsData(data);
        
        // Determine status based on values
        const getIncidentStatus = (count: number) => {
          if (count > 50) return "warning";
          if (count > 30) return "normal";
          return "good";
        };

        const getResponseTimeStatus = (time: string) => {
          const minutes = parseFloat(time);
          if (minutes > 15) return "warning";
          if (minutes > 10) return "normal";
          return "good";
        };

        const getResolutionRateStatus = (rate: string) => {
          const percentage = parseInt(rate);
          if (percentage >= 90) return "excellent";
          if (percentage >= 75) return "good";
          return "warning";
        };

        const getActiveUnitsStatus = (units: string) => {
          const [active, total] = units.split('/').map(Number);
          const percentage = (active / total) * 100;
          if (percentage > 80) return "warning";
          if (percentage > 50) return "normal";
          return "good";
        };

        setAnalyticsSummary([
          {
            title: "Total Incidents Today",
            value: data.totalIncidentsToday.toString(),
            icon: "🚨",
            status: getIncidentStatus(data.totalIncidentsToday),
          },
          {
            title: "Average Response Time",
            value: data.averageResponseTime,
            icon: "⏱️",
            status: getResponseTimeStatus(data.averageResponseTime),
          },
          {
            title: "Active Units",
            value: data.activeUnits,
            icon: "🚑",
            status: getActiveUnitsStatus(data.activeUnits),
          },
          {
            title: "Resolution Rate",
            value: data.resolutionRate,
            icon: "✅",
            status: getResolutionRateStatus(data.resolutionRate),
          },
        ]);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics data. Using cached data.');
        // Fallback to default values
        setAnalyticsSummary([
          {
            title: "Total Incidents Today",
            value: "0",
            icon: "🚨",
            status: "normal",
          },
          {
            title: "Average Response Time",
            value: "0 minutes",
            icon: "⏱️",
            status: "good",
          },
          {
            title: "Active Units",
            value: "0/0",
            icon: "🚑",
            status: "good",
          },
          {
            title: "Resolution Rate",
            value: "0%",
            icon: "✅",
            status: "normal",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    
    // Refresh analytics every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    
    return () => clearInterval(interval);
  }, []);



  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600 bg-green-50";
      case "good":
        return "text-blue-600 bg-blue-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img
                src="/images/respondr-horizontal.svg"
                alt="Respondr"
                className="h-8 w-auto"
              />
              <span className="ml-2 text-xl font-semibold text-gray-900">
                Supervisor Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Section Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Sections">
            <button
              onClick={() => setActiveSection('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveSection('equipment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'equipment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔧 Equipment Management
            </button>
            <button
              onClick={() => setActiveSection('shifts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'shifts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📅 Shift Management
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <>
            {/* Analytics Summary */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Analytics Overview
                  </h3>
                  <span className="text-xs text-gray-500 flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Live Data • Auto-refresh every 30s
                  </span>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Loading State */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className="p-6 rounded-xl border-2 border-gray-200 bg-gray-50 animate-pulse"
                      >
                        <div className="text-center">
                          <div className="h-10 w-10 bg-gray-300 rounded-full mx-auto mb-3"></div>
                          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
                          <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Analytics Cards */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {analyticsSummary.map((item, index) => (
                      <div
                        key={index}
                        className={`p-6 rounded-xl border-2 ${getStatusColor(item.status)} hover:shadow-lg transition-shadow`}
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-3">{item.icon}</div>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">
                            {item.title}
                          </h4>
                          <p className="text-3xl font-bold text-gray-900">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Analytics - Only show when not loading */}
            {!loading && analyticsData && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Incident Status Breakdown */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Incident Status</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">🟡 Pending</span>
                        <span className="text-lg font-bold text-gray-900">{analyticsData.incidentStatus.pending}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">🔵 Assigned</span>
                        <span className="text-lg font-bold text-gray-900">{analyticsData.incidentStatus.assigned}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">🟠 En Route</span>
                        <span className="text-lg font-bold text-gray-900">{analyticsData.incidentStatus.en_route}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">🔴 On Scene</span>
                        <span className="text-lg font-bold text-gray-900">{analyticsData.incidentStatus.on_scene}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm text-gray-600">✅ Resolved</span>
                        <span className="text-lg font-bold text-green-600">{analyticsData.incidentStatus.resolved}</span>
                      </div>
                    </div>
                  </div>

                  {/* Incident Type Distribution */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">📋 Incident Types</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">🚑 Medical</span>
                        <span className="text-lg font-bold text-gray-900">{analyticsData.incidentTypes.medical}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">🔥 Fire</span>
                        <span className="text-lg font-bold text-gray-900">{analyticsData.incidentTypes.fire}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">🚨 Rescue</span>
                        <span className="text-lg font-bold text-gray-900">{analyticsData.incidentTypes.rescue}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">📦 Other</span>
                        <span className="text-lg font-bold text-gray-900">{analyticsData.incidentTypes.other}</span>
                      </div>
                    </div>
                  </div>

                  {/* Crew Availability Status */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">👥 Crew Status</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">✅ Available</span>
                        <span className="text-lg font-bold text-green-600">{analyticsData.crewStatus.available}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">🔵 On Duty</span>
                        <span className="text-lg font-bold text-blue-600">{analyticsData.crewStatus.onDuty}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm text-gray-600 font-medium">Total Crews</span>
                        <span className="text-lg font-bold text-gray-900">{analyticsData.crewStatus.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Second Row: Vehicle Status and Geographic Hotspots */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Vehicle Status Overview */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">🚗 Vehicle Status</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">✅ Ready</span>
                        <span className="text-lg font-bold text-green-600">{analyticsData.vehicleStatus.ready}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">🔧 Maintenance</span>
                        <span className="text-lg font-bold text-yellow-600">{analyticsData.vehicleStatus.maintenance}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">❌ Out of Service</span>
                        <span className="text-lg font-bold text-red-600">{analyticsData.vehicleStatus.outOfService}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm text-gray-600 font-medium">Total Vehicles</span>
                        <span className="text-lg font-bold text-gray-900">{analyticsData.vehicleStatus.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Geographic Hotspots */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">🗺️ Top Locations (Today)</h4>
                    <div className="space-y-3">
                      {analyticsData.topLocations.length > 0 ? (
                        analyticsData.topLocations.map((location, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {location.district}
                            </span>
                            <span className="text-lg font-bold text-gray-900">{location.count}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <span className="text-sm text-gray-500">No incidents today</span>
                        </div>
                      )}
                      {analyticsData.topLocations.length > 0 && (
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-sm text-gray-600 font-medium">Total Incidents</span>
                          <span className="text-lg font-bold text-gray-900">
                            {analyticsData.topLocations.reduce((sum, loc) => sum + loc.count, 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Equipment Management Section */}
        {activeSection === 'equipment' && (
          <SupervisorEquipmentSection />
        )}

        {/* Shift Management Section */}
        {activeSection === 'shifts' && (
          <SupervisorShiftSection />
        )}
      </div>
    </div>
  );
};

export default ModularSupervisorDashboard;