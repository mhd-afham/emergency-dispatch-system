const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Vehicle = require('../models/Vehicle');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/analytics/summary
 * Get analytics summary for dashboard overview
 * Query params: range (daily, weekly, monthly, yearly)
 */
router.get('/summary', authenticate, async (req, res) => {
  try {
    // Get date range based on query parameter (default: daily)
    const range = req.query.range || 'daily';
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    startDate.setHours(0, 0, 0, 0);
    
    switch (range) {
      case 'daily':
        // Today only
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        // Last 7 days
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date();
        break;
      case 'monthly':
        // Last 30 days
        startDate.setDate(startDate.getDate() - 30);
        endDate = new Date();
        break;
      case 'yearly':
        // Last 365 days
        startDate.setDate(startDate.getDate() - 365);
        endDate = new Date();
        break;
      default:
        // Default to today
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
    }

    const today = startDate;
    const tomorrow = endDate;

    // Debug: Check all incidents in database
    const allIncidentsCount = await Incident.countDocuments({});
    const allIncidentsSample = await Incident.find({})
      .limit(5)
      .select('incidentId incidentType createdAt')
      .sort({ createdAt: -1 });
    
    console.log('📊 Analytics Debug - Range:', range);
    console.log('📊 Analytics Debug - All Incidents Check:');
    console.log('  Total Incidents in DB:', allIncidentsCount);
    console.log('  Recent Incidents Sample:', JSON.stringify(allIncidentsSample, null, 2));

    // 1. Total Incidents in Range
    const totalIncidentsToday = await Incident.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    console.log('  Date Range:', today.toISOString(), 'to', tomorrow.toISOString());
    console.log('  Total Incidents in Range:', totalIncidentsToday);

    // 2. Average Response Time (in minutes)
    const resolvedIncidents = await Incident.find({
      status: 'resolved',
      resolvedAt: { $exists: true },
      createdAt: { $gte: today, $lt: tomorrow } // Use selected range instead of fixed 7 days
    }).select('createdAt resolvedAt');

    console.log('📊 Response Time Debug:');
    console.log('  Resolved incidents found:', resolvedIncidents.length);
    if (resolvedIncidents.length > 0) {
      console.log('  Sample resolved incident:', JSON.stringify(resolvedIncidents[0], null, 2));
    }

    let averageResponseTime = 0;
    if (resolvedIncidents.length > 0) {
      const responseTimes = [];
      const validIncidents = [];
      
      resolvedIncidents.forEach(incident => {
        const responseMinutes = (incident.resolvedAt - incident.createdAt) / (1000 * 60);
        
        // Filter out unrealistic times (negative or > 24 hours)
        // Realistic emergency response should be under 24 hours (1440 minutes)
        if (responseMinutes > 0 && responseMinutes <= 1440) {
          validIncidents.push(incident);
          responseTimes.push({
            id: incident.incidentId || incident._id,
            created: incident.createdAt,
            resolved: incident.resolvedAt,
            minutes: responseMinutes.toFixed(1)
          });
        } else {
          console.log(`  ⚠️ INVALID response time detected: ${responseMinutes.toFixed(1)} minutes`);
          console.log(`     Incident: ${incident.incidentId || incident._id}`);
          console.log(`     Created: ${incident.createdAt}`);
          console.log(`     Resolved: ${incident.resolvedAt}`);
        }
      });
      
      if (validIncidents.length > 0) {
        const totalResponseTime = validIncidents.reduce((sum, incident) => {
          const responseMinutes = (incident.resolvedAt - incident.createdAt) / (1000 * 60);
          return sum + responseMinutes;
        }, 0);
        averageResponseTime = (totalResponseTime / validIncidents.length).toFixed(1);
        
        // Debug: Show individual response times
        console.log('  Valid response times:', validIncidents.length, '/', resolvedIncidents.length);
        if (responseTimes.length <= 10) {
          responseTimes.forEach((rt, idx) => {
            console.log(`    [${idx + 1}] ${rt.minutes} minutes`);
          });
        } else {
          console.log(`    First 5: ${responseTimes.slice(0, 5).map(rt => rt.minutes).join(', ')} minutes`);
          console.log(`    Last 5: ${responseTimes.slice(-5).map(rt => rt.minutes).join(', ')} minutes`);
        }
        console.log('  Average:', averageResponseTime, 'minutes');
      } else {
        console.log('  ⚠️ No valid response times found (all incidents have unrealistic timestamps)');
      }
    }

    // 3. Active Units (vehicles available and ready to respond)
    const availableVehicles = await Vehicle.countDocuments({
      isActive: true,
      'status.operational': 'active',
      'status.currentStatus': 'available'
    });
    
    console.log('📊 Active Units Debug:');
    console.log('  Available vehicles (ready to respond):', availableVehicles);

    // 4. Resolution Rate (within selected range)
    const totalIncidentsInRange = await Incident.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    const resolvedIncidentsInRange = await Incident.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
      status: 'resolved'
    });

    const resolutionRate = totalIncidentsInRange > 0 
      ? Math.round((resolvedIncidentsInRange / totalIncidentsInRange) * 100)
      : 0;

    // 5. Incident Status Breakdown (within range)
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

    // 6. Incident Type Distribution (within range)
    const incidentsByType = await Incident.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$incidentType',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeDistribution = {
      medical: 0,
      fire: 0,
      rescue: 0,
      hazmat: 0,
      traffic: 0,
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

    // Debug: Log the incident type distribution
    console.log('📊 Analytics Debug - Incident Types (Range):', range);
    console.log('  Date Range:', today.toISOString(), 'to', tomorrow.toISOString());
    console.log('  Raw MongoDB Results:', JSON.stringify(incidentsByType, null, 2));
    console.log('  Final Distribution:', typeDistribution);
    console.log('  Total Incidents in Range:', totalIncidentsToday);

    // 7. Crew Availability Status
    const Crew = require('../models/Crew');
    
    // Debug: Check crew data structure
    const totalAllCrews = await Crew.countDocuments({});
    const totalCrews = await Crew.countDocuments({ 'settings.isActive': true });
    const sampleCrew = await Crew.findOne({}).select('settings.isActive currentStatus');
    
    console.log('📊 Crew Debug:');
    console.log('  Total crews in DB (all):', totalAllCrews);
    console.log('  Total crews (settings.isActive=true):', totalCrews);
    console.log('  Sample crew structure:', JSON.stringify(sampleCrew, null, 2));
    
    // Check all availability statuses in the database
    const crewsByAvailability = await Crew.aggregate([
      {
        $match: { 'settings.isActive': true }
      },
      {
        $group: {
          _id: '$currentStatus.availability',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('  Active crews by availability:', JSON.stringify(crewsByAvailability, null, 2));
    
    // Correct field path: settings.isActive and currentStatus.availability
    const availableCrews = await Crew.countDocuments({ 
      'settings.isActive': true,
      'currentStatus.availability': 'available'
    });
    const onDutyCrews = await Crew.countDocuments({ 
      'settings.isActive': true,
      'currentStatus.availability': 'on_duty'
    });
    
    console.log('  Available crews (settings.isActive=true):', availableCrews);
    console.log('  On duty crews (settings.isActive=true):', onDutyCrews);

    // 8. Vehicle Status Overview
    // Debug: Check vehicle data structure
    const sampleVehicle = await Vehicle.findOne({}).select('isActive status');
    console.log('📊 Vehicle Debug:');
    console.log('  Sample vehicle structure:', JSON.stringify(sampleVehicle, null, 2));
    
    const allVehicles = await Vehicle.countDocuments({ isActive: true });
    
    console.log('  Total vehicles (isActive=true):', allVehicles);
    
    // Correct field path: status.operational
    const readyVehicles = await Vehicle.countDocuments({
      isActive: true,
      'status.operational': 'active'
    });
    
    const maintenanceVehicles = await Vehicle.countDocuments({
      isActive: true,
      'status.operational': 'maintenance'
    });
    
    const outOfServiceVehicles = await Vehicle.countDocuments({
      isActive: true,
      'status.operational': 'out_of_service'
    });
    
    // Calculate total based on actual operational statuses
    const totalVehiclesCalculated = readyVehicles + maintenanceVehicles + outOfServiceVehicles;
    
    console.log('  Ready vehicles (active):', readyVehicles);
    console.log('  Maintenance vehicles:', maintenanceVehicles);
    console.log('  Out of service vehicles:', outOfServiceVehicles);
    console.log('  Total calculated:', totalVehiclesCalculated);

    // 9. Geographic Hotspots (Top 3 locations in range)
    const locationHotspots = await Incident.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          'location.city': { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$location.city',
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
        averageResponseTime: averageResponseTime > 0 
          ? `${averageResponseTime} minutes` 
          : 'N/A', // Show N/A instead of 0 when no valid data
        activeUnits: `${availableVehicles}/${allVehicles}`, // Available and ready vehicles vs total active
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
          total: allVehicles // Use total active vehicles count
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
