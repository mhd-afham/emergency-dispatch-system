const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Vehicle = require('../models/Vehicle');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/analytics/summary
 * Get analytics summary for dashboard overview
 */
router.get('/summary', authenticate, async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Total Incidents Today
    const totalIncidentsToday = await Incident.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // 2. Average Response Time (in minutes)
    const resolvedIncidents = await Incident.find({
      status: 'resolved',
      resolvedAt: { $exists: true },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).select('createdAt resolvedAt');

    let averageResponseTime = 0;
    if (resolvedIncidents.length > 0) {
      const totalResponseTime = resolvedIncidents.reduce((sum, incident) => {
        const responseMinutes = (incident.resolvedAt - incident.createdAt) / (1000 * 60);
        return sum + responseMinutes;
      }, 0);
      averageResponseTime = (totalResponseTime / resolvedIncidents.length).toFixed(1);
    }

    // 3. Active Units (vehicles currently on assignments)
    const totalVehicles = await Vehicle.countDocuments({ 
      'status.operational': 'active',
      isActive: true
    });
    
    const activeVehicles = await Vehicle.countDocuments({
      'status.currentStatus': { $in: ['en_route', 'on_scene'] },
      isActive: true
    });

    // 4. Resolution Rate (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const totalIncidentsLast30Days = await Incident.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    const resolvedIncidentsLast30Days = await Incident.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      status: 'resolved'
    });

    const resolutionRate = totalIncidentsLast30Days > 0 
      ? Math.round((resolvedIncidentsLast30Days / totalIncidentsLast30Days) * 100)
      : 0;

    // 5. Incident Status Breakdown (Today)
    const incidentsByStatus = await Incident.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusBreakdown = {
      pending: 0,
      assigned: 0,
      en_route: 0,
      on_scene: 0,
      resolved: 0
    };

    incidentsByStatus.forEach(item => {
      if (statusBreakdown.hasOwnProperty(item._id)) {
        statusBreakdown[item._id] = item.count;
      }
    });

    // 6. Incident Type Distribution (Today)
    const incidentsByType = await Incident.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeDistribution = {
      medical: 0,
      fire: 0,
      rescue: 0,
      other: 0
    };

    incidentsByType.forEach(item => {
      const type = item._id ? item._id.toLowerCase() : 'other';
      if (typeDistribution.hasOwnProperty(type)) {
        typeDistribution[type] = item.count;
      } else {
        typeDistribution.other += item.count;
      }
    });

    // 7. Crew Availability Status
    const Crew = require('../models/Crew');
    
    const totalCrews = await Crew.countDocuments({ isActive: true });
    const availableCrews = await Crew.countDocuments({ 
      isActive: true,
      'availability.status': 'available'
    });
    const onDutyCrews = await Crew.countDocuments({ 
      isActive: true,
      'availability.status': 'on_duty'
    });

    // 8. Vehicle Status Overview
    const readyVehicles = await Vehicle.countDocuments({
      'status.operational': 'active',
      'status.currentStatus': 'available',
      isActive: true
    });
    
    const maintenanceVehicles = await Vehicle.countDocuments({
      'status.operational': 'maintenance',
      isActive: true
    });
    
    const outOfServiceVehicles = await Vehicle.countDocuments({
      'status.operational': 'out_of_service',
      isActive: true
    });

    // 9. Geographic Hotspots (Top 3 locations today)
    const locationHotspots = await Incident.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          'location.district': { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$location.district',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 3
      }
    ]);

    const topLocations = locationHotspots.map(loc => ({
      district: loc._id || 'Unknown',
      count: loc.count
    }));

    // Return analytics summary
    res.json({
      success: true,
      data: {
        totalIncidentsToday,
        averageResponseTime: `${averageResponseTime} minutes`,
        activeUnits: `${activeVehicles}/${totalVehicles}`,
        resolutionRate: `${resolutionRate}%`,
        incidentStatus: statusBreakdown,
        incidentTypes: typeDistribution,
        crewStatus: {
          available: availableCrews,
          onDuty: onDutyCrews,
          total: totalCrews
        },
        vehicleStatus: {
          ready: readyVehicles,
          maintenance: maintenanceVehicles,
          outOfService: outOfServiceVehicles,
          total: totalVehicles
        },
        topLocations: topLocations
      }
    });

  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics summary',
      error: error.message
    });
  }
});

module.exports = router;
