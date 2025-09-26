import React, { useState, useEffect } from 'react';
import { equipmentService, EquipmentStatistics, EquipmentCheck } from '../../services/equipment';

interface EquipmentDashboardProps {
  className?: string;
}

const EquipmentDashboard: React.FC<EquipmentDashboardProps> = ({ className = '' }) => {
  const [statistics, setStatistics] = useState<EquipmentStatistics | null>(null);
  const [recentChecks, setRecentChecks] = useState<EquipmentCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load statistics and recent checks in parallel
      const [statsData, checksData] = await Promise.all([
        equipmentService.getEquipmentStatistics(timeframe),
        equipmentService.getAllEquipmentChecks({ page: 1, limit: 5, sortBy: 'audit.createdAt', sortOrder: 'desc' })
      ]);

      setStatistics(statsData);
      setRecentChecks(checksData.equipmentChecks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load equipment dashboard data');
      console.error('Equipment dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'passed':
        return 'text-green-600 bg-green-100';
      case 'minor_issues':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical_failure':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
        <div className="text-center text-red-600">
          <p className="mb-2">❌ {error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Equipment Readiness Dashboard</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Timeframe:</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'today' | 'week' | 'month')}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{statistics.statistics.totalChecks}</div>
            <div className="text-sm text-blue-600">Total Checks</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{statistics.statistics.passedChecks}</div>
            <div className="text-sm text-green-600">Passed</div>
            <div className="text-xs text-green-500">{statistics.statistics.passRate}%</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{statistics.statistics.minorIssues}</div>
            <div className="text-sm text-yellow-600">Minor Issues</div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{statistics.statistics.criticalFailures}</div>
            <div className="text-sm text-red-600">Critical Failures</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{statistics.statistics.failureRate}%</div>
            <div className="text-sm text-gray-600">Failure Rate</div>
          </div>
        </div>
      )}

      {/* Recent Equipment Checks */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Equipment Checks</h3>
        
        {recentChecks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No equipment checks found for the selected timeframe.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Vehicle</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Inspector</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Results</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentChecks.map((check) => (
                  <tr key={check._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {check.vehicleId?.registration?.plateNumber || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {check.vehicleId?.type} - {check.vehicleId?.specifications?.model}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {check.crewId?.personal?.firstName} {check.crewId?.personal?.lastName}
                        </div>
                        <div className="text-gray-500">{check.crewId?.professional?.role}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(check.inspection.overallStatus)}`}>
                        {check.inspection.overallStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <span className="text-green-600">✓ {check.inspection.passCount}</span>
                        {check.inspection.failCount > 0 && (
                          <span className="text-red-600 ml-2">✗ {check.inspection.failCount}</span>
                        )}
                        {check.inspection.warningCount > 0 && (
                          <span className="text-yellow-600 ml-2">⚠ {check.inspection.warningCount}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatDateTime(check.audit.createdAt.toString())}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          // Handle view details
                          console.log('View check details:', check._id);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            // Handle new equipment check
            console.log('Start new equipment check');
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + New Equipment Check
        </button>
        
        <button
          onClick={() => {
            // Handle view all checks
            console.log('View all equipment checks');
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          View All Checks
        </button>
        
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default EquipmentDashboard;