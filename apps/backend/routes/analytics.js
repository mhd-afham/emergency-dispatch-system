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
      'operationalStatus.currentStatus': { $in: ['available', 'on_duty', 'en_route', 'on_scene'] }
    });
    
    const activeVehicles = await Vehicle.countDocuments({
      'operationalStatus.currentStatus': { $in: ['en_route', 'on_scene'] }
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

    // Return analytics summary
    res.json({
      success: true,
      data: {
        totalIncidentsToday,
        averageResponseTime: `${averageResponseTime} minutes`,
        activeUnits: `${activeVehicles}/${totalVehicles}`,
        resolutionRate: `${resolutionRate}%`
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
