const Vehicle = require('../models/Vehicle');
const Crew = require('../models/Crew');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

/**
 * Report Controller for Emergency Dispatch System
 * Handles report generation for vehicles and crew members
 * 
 * Author: Inusha Nawanjana
 * Date: October 21, 2025
 */

// Helper function to map user roles to audit log roles
const mapRoleForAudit = (userRole) => {
  const roleMap = {
    'Admin': 'admin',
    'Supervisor': 'supervisor',
    'Dispatcher': 'dispatcher',
    'Field Crew': 'crew_member',
    'Call Taker': 'dispatcher', // Map to dispatcher as closest match
    'Citizen': 'crew_member' // Map to crew_member as default
  };
  return roleMap[userRole] || 'crew_member';
};

/**
 * Generate report based on filters
 * POST /api/reports/generate
 */
const generateReport = async (req, res) => {
  try {
    console.log('📊 Generating report with filters:', req.body);

    const {
      timePeriod,      // 'day', 'week', 'month', 'year', 'custom'
      customStartDate,
      customEndDate,
      sections,        // ['vehicle', 'crew'] or ['vehicle'] or ['crew']
      status,          // ['approved', 'rejected'] or ['approved'] or ['rejected']
      individualType,  // 'vehicle' or 'crew'
      plateNumber,     // For individual vehicle search
      employeeId,      // For individual crew search
    } = req.body;

    // Validate required fields for general reports
    if (!plateNumber && !employeeId) {
      if (!sections || !Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please select at least one section (vehicle or crew)'
        });
      }

      if (!status || !Array.isArray(status) || status.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please select at least one status filter'
        });
      }

      if (!timePeriod) {
        return res.status(400).json({
          success: false,
          message: 'Please select a time period'
        });
      }
    }

    // Build date range based on time period
      let startDate, endDate;
      
      if (timePeriod === 'custom') {
        if (!customStartDate || !customEndDate) {
          return res.status(400).json({
            success: false,
            message: 'Custom date range requires both start and end dates'
          });
        }
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999); // Include full end date
      } else {
        endDate = new Date();
        startDate = new Date();
        
        switch (timePeriod) {
          case 'day':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            startDate.setMonth(startDate.getMonth() - 1); // Default to last month
        }
      }

      console.log('📅 Date range:', { startDate, endDate });

      const reportData = {
        generatedAt: new Date(),
        filters: {
          timePeriod,
          startDate,
          endDate,
          sections,
          status
        },
        data: {}
      };

      // Handle individual search
      if (plateNumber || employeeId) {
        if (plateNumber) {
          const vehicle = await Vehicle.findOne({ 
            'registration.plateNumber': plateNumber.toUpperCase() 
          })
            .populate('registrationStatus.approvedBy', 'personal.firstName personal.lastName auth.role')
            .populate('registrationStatus.rejectedBy', 'personal.firstName personal.lastName auth.role')
            .populate('station.homeStationId', 'name location')
            .populate('audit.createdBy', 'personal.firstName personal.lastName');

          if (!vehicle) {
            return res.status(404).json({
              success: false,
              message: 'Vehicle not found with the provided plate number'
            });
          }

          reportData.data.vehicles = [vehicle];
          reportData.data.vehicleCount = 1;
        }

        if (employeeId) {
          const crew = await Crew.findOne({ 
            'personal.employeeId': employeeId.toUpperCase() 
          })
            .populate('registrationStatus.approvedBy', 'personal.firstName personal.lastName auth.role')
            .populate('registrationStatus.rejectedBy', 'personal.firstName personal.lastName auth.role')
            .populate('audit.createdBy', 'personal.firstName personal.lastName');

          if (!crew) {
            return res.status(404).json({
              success: false,
              message: 'Crew member not found with the provided employee ID'
            });
          }

          reportData.data.crew = [crew];
          reportData.data.crewCount = 1;
        }

        console.log('✅ Individual report generated successfully');
        return res.status(200).json({
          success: true,
          message: 'Report generated successfully',
          data: reportData
        });
      }

      // Generate report for vehicles
      if (sections.includes('vehicle')) {
        const vehicleQuery = {
          'audit.createdAt': { $gte: startDate, $lte: endDate }
        };

        // Add status filter
        if (status && status.length > 0) {
          if (status.length === 1) {
            vehicleQuery['registrationStatus.status'] = status[0];
          } else {
            vehicleQuery['registrationStatus.status'] = { $in: status };
          }
        }

        const vehicles = await Vehicle.find(vehicleQuery)
          .populate('registrationStatus.approvedBy', 'personal.firstName personal.lastName auth.role')
          .populate('registrationStatus.rejectedBy', 'personal.firstName personal.lastName auth.role')
          .populate('station.homeStationId', 'name location')
          .populate('audit.createdBy', 'personal.firstName personal.lastName')
          .sort({ 'audit.createdAt': -1 });

        // Calculate statistics
        const vehicleStats = {
          total: vehicles.length,
          approved: vehicles.filter(v => v.registrationStatus?.status === 'approved').length,
          rejected: vehicles.filter(v => v.registrationStatus?.status === 'rejected').length,
          pending: vehicles.filter(v => v.registrationStatus?.status === 'pending').length,
          byType: {}
        };

        // Count by vehicle type
        vehicles.forEach(v => {
          const type = v.registration.vehicleType;
          vehicleStats.byType[type] = (vehicleStats.byType[type] || 0) + 1;
        });

        reportData.data.vehicles = vehicles;
        reportData.data.vehicleStats = vehicleStats;
        reportData.data.vehicleCount = vehicles.length;

        console.log(`📊 Vehicle data: ${vehicles.length} records`);
      }

      // Generate report for crew members
      if (sections.includes('crew')) {
        const crewQuery = {
          'audit.createdAt': { $gte: startDate, $lte: endDate }
        };

        // Add status filter
        if (status && status.length > 0) {
          if (status.length === 1) {
            crewQuery['registrationStatus.status'] = status[0];
          } else {
            crewQuery['registrationStatus.status'] = { $in: status };
          }
        }

        const crew = await Crew.find(crewQuery)
          .populate('registrationStatus.approvedBy', 'personal.firstName personal.lastName auth.role')
          .populate('registrationStatus.rejectedBy', 'personal.firstName personal.lastName auth.role')
          .populate('audit.createdBy', 'personal.firstName personal.lastName')
          .sort({ 'audit.createdAt': -1 });

        // Calculate statistics
        const crewStats = {
          total: crew.length,
          approved: crew.filter(c => c.registrationStatus?.status === 'approved').length,
          rejected: crew.filter(c => c.registrationStatus?.status === 'rejected').length,
          pending: crew.filter(c => c.registrationStatus?.status === 'pending').length,
          byRole: {},
          byCertificationLevel: {}
        };

        // Count by role and certification level
        crew.forEach(c => {
          const role = c.professional.role;
          const level = c.professional.certificationLevel;
          
          crewStats.byRole[role] = (crewStats.byRole[role] || 0) + 1;
          crewStats.byCertificationLevel[level] = (crewStats.byCertificationLevel[level] || 0) + 1;
        });

        reportData.data.crew = crew;
        reportData.data.crewStats = crewStats;
        reportData.data.crewCount = crew.length;

        console.log(`📊 Crew data: ${crew.length} records`);
      }

      // Log report generation in audit log
      await AuditLog.logAction({
        actionType: 'export',
        description: `Generated ${sections.join(' and ')} report for ${timePeriod} period`,
        outcome: 'success',
        userId: req.user._id,
        username: `${req.user.personal.firstName} ${req.user.personal.lastName}`,
        userRole: mapRoleForAudit(req.user.auth.role),
        entityType: 'Report',
        entityId: new mongoose.Types.ObjectId(), // Generate a unique ID for this report
        entityName: `${sections.join(' and ')} Report - ${timePeriod}`,
        module: 'reporting',
        feature: 'report_generation',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          timePeriod,
          sections,
          status,
          vehicleCount: reportData.data.vehicleCount || 0,
          crewCount: reportData.data.crewCount || 0,
          totalRecords: (reportData.data.vehicleCount || 0) + (reportData.data.crewCount || 0)
        }
      });

      console.log('✅ Report generated successfully');

      res.status(200).json({
        success: true,
        message: 'Report generated successfully',
        data: reportData
      });

    } catch (error) {
      console.error('❌ Report generation error:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate report',
        error: error.message
      });
    }
};

/**
 * Get report statistics summary
 * GET /api/reports/summary
 */
const getReportSummary = async (req, res) => {
  try {
    console.log('📈 Fetching report summary');

    // Get counts
    const totalVehicles = await Vehicle.countDocuments({});
    const approvedVehicles = await Vehicle.countDocuments({ 
      'registrationStatus.status': 'approved' 
    });
    const rejectedVehicles = await Vehicle.countDocuments({ 
      'registrationStatus.status': 'rejected' 
    });
    const pendingVehicles = await Vehicle.countDocuments({ 
      'registrationStatus.status': 'pending' 
    });

    const totalCrew = await Crew.countDocuments({});
    const approvedCrew = await Crew.countDocuments({ 
      'registrationStatus.status': 'approved' 
    });
    const rejectedCrew = await Crew.countDocuments({ 
      'registrationStatus.status': 'rejected' 
    });
    const pendingCrew = await Crew.countDocuments({ 
      'registrationStatus.status': 'pending' 
    });

    const summary = {
      vehicles: {
        total: totalVehicles,
        approved: approvedVehicles,
        rejected: rejectedVehicles,
        pending: pendingVehicles
      },
      crew: {
        total: totalCrew,
        approved: approvedCrew,
        rejected: rejectedCrew,
        pending: pendingCrew
      },
      overall: {
        total: totalVehicles + totalCrew,
        approved: approvedVehicles + approvedCrew,
        rejected: rejectedVehicles + rejectedCrew,
        pending: pendingVehicles + pendingCrew
      }
    };

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('❌ Summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary',
      error: error.message
    });
  }
};

module.exports = {
  generateReport,
  getReportSummary
};
