const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const Incident = require("../models/Incident");
const Vehicle = require("../models/Vehicle");
const Crew = require("../models/Crew");
const {
  generateReport,
  getReportSummary,
} = require("../controllers/reportController");
const { authenticate, authorize } = require("../middleware/auth");

/**
 * Report Routes for Emergency Dispatch System
 *
 * Author: Inusha Nawanjana & Team
 * Date: October 21-23, 2025
 */

/**
 * @route   POST /api/reports/generate
 * @desc    Generate report based on filters
 * @access  Private (Admin only)
 */
router.post("/generate", authenticate, authorize("Admin"), generateReport);

/**
 * @route   GET /api/reports/summary
 * @desc    Get report statistics summary
 * @access  Private (Admin only)
 */
router.get("/summary", authenticate, authorize("Admin"), getReportSummary);

/**
 * GET /api/reports/analytics-pdf
 * Generate and download analytics summary as PDF
 * Query params: range (daily, weekly, monthly, yearly)
 */
router.get("/analytics-pdf", authenticate, async (req, res) => {
  try {
    const range = req.query.range || "daily";
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    startDate.setHours(0, 0, 0, 0);

    // Calculate date range
    switch (range) {
      case "daily":
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case "weekly":
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date();
        break;
      case "monthly":
        startDate.setDate(startDate.getDate() - 30);
        endDate = new Date();
        break;
      case "yearly":
        startDate.setDate(startDate.getDate() - 365);
        endDate = new Date();
        break;
      default:
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
    }

    // Fetch analytics data
    const totalIncidents = await Incident.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
    });

    // Incident status breakdown
    const incidentsByStatus = await Incident.aggregate([
      { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Incident type breakdown
    const incidentsByType = await Incident.aggregate([
      { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: "$incidentType", count: { $sum: 1 } } },
    ]);

    // Response time
    const resolvedIncidents = await Incident.find({
      status: "resolved",
      resolvedAt: { $exists: true },
      createdAt: { $gte: startDate, $lt: endDate },
    }).select("createdAt resolvedAt");

    let averageResponseTime = "N/A";
    if (resolvedIncidents.length > 0) {
      const validIncidents = resolvedIncidents.filter((incident) => {
        const responseMinutes =
          (incident.resolvedAt - incident.createdAt) / (1000 * 60);
        return responseMinutes > 0 && responseMinutes <= 1440;
      });

      if (validIncidents.length > 0) {
        const totalResponseTime = validIncidents.reduce((sum, incident) => {
          return sum + (incident.resolvedAt - incident.createdAt) / (1000 * 60);
        }, 0);
        averageResponseTime =
          (totalResponseTime / validIncidents.length).toFixed(1) + " minutes";
      }
    }

    // Resolution rate
    const resolvedCount = await Incident.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      status: "resolved",
    });
    const resolutionRate =
      totalIncidents > 0
        ? Math.round((resolvedCount / totalIncidents) * 100) + "%"
        : "0%";

    // Vehicle status
    const vehicleStats = {
      ready: await Vehicle.countDocuments({
        isActive: true,
        "status.operational": "active",
      }),
      maintenance: await Vehicle.countDocuments({
        isActive: true,
        "status.operational": "maintenance",
      }),
      outOfService: await Vehicle.countDocuments({
        isActive: true,
        "status.operational": "out_of_service",
      }),
      total: await Vehicle.countDocuments({ isActive: true }),
    };

    // Crew status
    const crewStats = {
      available: await Crew.countDocuments({
        isActive: true,
        "currentStatus.availability": "available",
      }),
      onDuty: await Crew.countDocuments({
        isActive: true,
        "currentStatus.availability": "on_duty",
      }),
      total: await Crew.countDocuments({ isActive: true }),
    };

    // Top locations
    const locationHotspots = await Incident.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          "location.city": { $exists: true, $ne: null, $ne: "" },
        },
      },
      { $group: { _id: "$location.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Create PDF with custom settings
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      bufferPages: true,
      info: {
        Title: `Analytics ${
          range.charAt(0).toUpperCase() + range.slice(1)
        } Report`,
        Author: "Respondr Emergency Dispatch System",
        Subject: "Emergency Response Analytics Report",
        Keywords: "emergency, dispatch, analytics, response",
      },
    });

    // Set response headers
    const rangeLabel = range.charAt(0).toUpperCase() + range.slice(1);
    const filename = `Respondr_Analytics_${rangeLabel}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // === COMPACT HEADER ===
    // Top border line
    doc.rect(0, 0, doc.page.width, 2).fill("#1e3a8a");

    // Draw simple logo icon (emergency symbol - circle with cross)
    const logoX = 55;
    const logoY = 28;
    const logoSize = 24;

    // Red circle
    doc.circle(logoX, logoY, logoSize / 2).fill("#dc2626");

    // White cross
    doc
      .fillColor("#ffffff")
      .rect(logoX - 2, logoY - logoSize / 3, 4, (logoSize * 2) / 3)
      .fill()
      .rect(logoX - logoSize / 3, logoY - 2, (logoSize * 2) / 3, 4)
      .fill();

    // Reset color and position for text
    doc.fillColor("#000000");

    // Company name and title - compact
    doc
      .fontSize(14)
      .fillColor("#1e3a8a")
      .font("Helvetica-Bold")
      .text("RESPONDR Emergency Dispatch System", 85, 18, {
        width: 400,
        align: "left",
      });

    doc
      .fontSize(10)
      .fillColor("#374151")
      .font("Helvetica-Bold")
      .text(`${rangeLabel} Analytics Report`, 85, 34, {
        width: 400,
        align: "left",
      });

    doc
      .fontSize(7)
      .fillColor("#6b7280")
      .font("Helvetica")
      .text(
        `Period: ${startDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })} - ${endDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`,
        85,
        48,
        {
          width: 400,
          align: "left",
        }
      );

    // Horizontal line below header
    doc
      .moveTo(50, 65)
      .lineTo(doc.page.width - 50, 65)
      .strokeColor("#d1d5db")
      .lineWidth(0.5)
      .stroke();

    // Reset
    doc.fillColor("#000000").font("Helvetica");
    doc.y = 75;

    // Executive Summary - Compact
    doc
      .fontSize(10)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("EXECUTIVE SUMMARY", 50, doc.y, { width: 495 });
    doc.moveDown(0.5);

    // Summary table
    const summaryData = [
      { label: "Total Incidents", value: totalIncidents },
      { label: "Average Response Time", value: averageResponseTime },
      { label: "Resolution Rate", value: resolutionRate },
    ];

    let tableY = doc.y;
    summaryData.forEach((item, index) => {
      // Alternating row backgrounds
      if (index % 2 === 0) {
        doc.rect(50, tableY - 1, 495, 18).fillAndStroke("#f3f4f6", "#e5e7eb");
      }

      doc
        .fontSize(8)
        .fillColor("#374151")
        .font("Helvetica")
        .text(item.label, 60, tableY + 4, { width: 280 });

      doc
        .fontSize(8)
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .text(String(item.value), 350, tableY + 4, {
          width: 180,
          align: "right",
        });

      tableY += 18;
    });

    doc.y = tableY + 10;

    // Incident Status - Compact
    doc
      .fontSize(10)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("INCIDENT STATUS BREAKDOWN", 50, doc.y, { width: 495 });
    doc.moveDown(0.5);

    const statusMap = {
      pending: 0,
      assigned: 0,
      en_route: 0,
      on_scene: 0,
      resolved: 0,
    };
    incidentsByStatus.forEach((item) => {
      if (statusMap.hasOwnProperty(item._id)) statusMap[item._id] = item.count;
    });

    const statusItems = [
      { label: "Pending", value: statusMap.pending },
      { label: "Assigned", value: statusMap.assigned },
      { label: "En Route", value: statusMap.en_route },
      { label: "On Scene", value: statusMap.on_scene },
      { label: "Resolved", value: statusMap.resolved },
    ];

    let statusY = doc.y;
    statusItems.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.rect(50, statusY - 1, 495, 16).fillAndStroke("#f3f4f6", "#e5e7eb");
      }

      doc
        .fontSize(8)
        .fillColor("#374151")
        .font("Helvetica")
        .text(item.label, 60, statusY + 3, { width: 380 });

      doc
        .fontSize(8)
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .text(String(item.value), 450, statusY + 3, {
          width: 80,
          align: "right",
        });

      statusY += 16;
    });

    doc.y = statusY + 10;

    // Incident Types - Compact
    doc
      .fontSize(10)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("INCIDENT TYPES DISTRIBUTION", 50, doc.y, { width: 495 });
    doc.moveDown(0.5);

    const typeMap = {
      medical: 0,
      fire: 0,
      rescue: 0,
      hazmat: 0,
      traffic: 0,
      other: 0,
    };
    incidentsByType.forEach((item) => {
      const type = item._id ? item._id.toLowerCase() : "other";
      if (typeMap.hasOwnProperty(type)) typeMap[type] = item.count;
      else typeMap.other += item.count;
    });

    const typeItems = [
      { label: "Medical Emergencies", value: typeMap.medical },
      { label: "Fire Incidents", value: typeMap.fire },
      { label: "Rescue Operations", value: typeMap.rescue },
      { label: "Hazardous Materials", value: typeMap.hazmat },
      { label: "Traffic Accidents", value: typeMap.traffic },
      { label: "Other Incidents", value: typeMap.other },
    ];

    let typeY = doc.y;
    typeItems.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.rect(50, typeY - 1, 495, 16).fillAndStroke("#f3f4f6", "#e5e7eb");
      }

      doc
        .fontSize(8)
        .fillColor("#374151")
        .font("Helvetica")
        .text(item.label, 60, typeY + 3, { width: 380 });

      doc
        .fontSize(8)
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .text(String(item.value), 450, typeY + 3, {
          width: 80,
          align: "right",
        });

      typeY += 16;
    });

    doc.y = typeY + 10;

    // Resource Status - Compact two column
    doc
      .fontSize(10)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("RESOURCE STATUS OVERVIEW", 50, doc.y, { width: 495 });
    doc.moveDown(0.5);

    const resourceY = doc.y;

    // Left box - Vehicles
    doc.rect(50, resourceY, 240, 70).fillAndStroke("#f3f4f6", "#d1d5db");
    doc
      .fontSize(9)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("Fleet Status", 60, resourceY + 6, { width: 220 });

    doc
      .fontSize(7)
      .fillColor("#374151")
      .font("Helvetica")
      .text("Operational", 60, resourceY + 22, { width: 150 });
    doc
      .font("Helvetica-Bold")
      .text(String(vehicleStats.ready), 220, resourceY + 22, {
        width: 60,
        align: "right",
      });

    doc
      .font("Helvetica")
      .text("Under Maintenance", 60, resourceY + 34, { width: 150 });
    doc
      .font("Helvetica-Bold")
      .text(String(vehicleStats.maintenance), 220, resourceY + 34, {
        width: 60,
        align: "right",
      });

    doc
      .font("Helvetica")
      .text("Out of Service", 60, resourceY + 46, { width: 150 });
    doc
      .font("Helvetica-Bold")
      .text(String(vehicleStats.outOfService), 220, resourceY + 46, {
        width: 60,
        align: "right",
      });

    // Divider line
    doc
      .moveTo(60, resourceY + 58)
      .lineTo(280, resourceY + 58)
      .strokeColor("#cbd5e1")
      .lineWidth(0.5)
      .stroke();

    doc
      .fontSize(7)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("Total Units", 60, resourceY + 61, { width: 150 });
    doc.text(String(vehicleStats.total), 220, resourceY + 61, {
      width: 60,
      align: "right",
    });

    // Right box - Crew
    doc.rect(305, resourceY, 240, 70).fillAndStroke("#f3f4f6", "#d1d5db");
    doc
      .fontSize(9)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("Personnel Status", 315, resourceY + 6, { width: 220 });

    doc
      .fontSize(7)
      .fillColor("#374151")
      .font("Helvetica")
      .text("Available", 315, resourceY + 22, { width: 150 });
    doc
      .font("Helvetica-Bold")
      .text(String(crewStats.available), 475, resourceY + 22, {
        width: 60,
        align: "right",
      });

    doc
      .font("Helvetica")
      .text("On Active Duty", 315, resourceY + 34, { width: 150 });
    doc
      .font("Helvetica-Bold")
      .text(String(crewStats.onDuty), 475, resourceY + 34, {
        width: 60,
        align: "right",
      });

    // Divider line
    doc
      .moveTo(315, resourceY + 50)
      .lineTo(535, resourceY + 50)
      .strokeColor("#cbd5e1")
      .lineWidth(0.5)
      .stroke();

    doc
      .fontSize(7)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("Total Personnel", 315, resourceY + 54, { width: 150 });
    doc.text(String(crewStats.total), 475, resourceY + 54, {
      width: 60,
      align: "right",
    });

    doc.y = resourceY + 80;

    // Top Locations - Compact list
    if (locationHotspots.length > 0) {
      doc
        .fontSize(10)
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .text("HIGH-ACTIVITY LOCATIONS", 50, doc.y, { width: 495 });
      doc.moveDown(0.5);

      let locY = doc.y;
      locationHotspots.forEach((loc, index) => {
        if (index % 2 === 0) {
          doc.rect(50, locY - 1, 495, 16).fillAndStroke("#f3f4f6", "#e5e7eb");
        }

        doc
          .fontSize(8)
          .fillColor("#374151")
          .font("Helvetica")
          .text(`${index + 1}. ${loc._id}`, 60, locY + 3, { width: 350 });

        doc
          .fontSize(8)
          .fillColor("#111827")
          .font("Helvetica-Bold")
          .text(
            `${loc.count} incident${loc.count !== 1 ? "s" : ""}`,
            420,
            locY + 3,
            { width: 110, align: "right" }
          );

        locY += 16;
      });

      doc.y = locY + 10;
    }

    // Disclaimer
    doc.moveDown(1.5);
    doc
      .fontSize(6)
      .fillColor("#9ca3af")
      .font("Helvetica-Oblique")
      .text(
        "CONFIDENTIAL: This document contains privileged information for authorized personnel only. Unauthorized disclosure or distribution is prohibited.",
        50,
        doc.y,
        { align: "center", width: 495 }
      );

    // Store generation date for footer
    const generatedDate = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Function to add footer to page
    // Store if we're currently adding a footer to prevent infinite loop
    let addingFooter = false;

    const addFooter = (pageNum) => {
      if (addingFooter) return; // Prevent infinite loop
      addingFooter = true;

      const pageHeight = doc.page.height;
      const footerTop = pageHeight - 45;

      // Save the current drawing state
      doc.save();

      // Top border line
      doc
        .moveTo(50, footerTop)
        .lineTo(doc.page.width - 50, footerTop)
        .strokeColor("#d1d5db")
        .lineWidth(0.5)
        .stroke();

      // Footer content - centered
      doc
        .fontSize(7)
        .fillColor("#6b7280")
        .font("Helvetica-Bold")
        .text("RESPONDR Emergency Dispatch System", 50, footerTop + 8, {
          width: 495,
          align: "center",
          lineBreak: false,
        });

      doc
        .fontSize(6)
        .fillColor("#9ca3af")
        .font("Helvetica")
        .text(
          "Emergency: 1-1-9 | support@respondr.lk | www.respondr.lk",
          50,
          footerTop + 18,
          {
            width: 495,
            align: "center",
            lineBreak: false,
          }
        );

      doc
        .fontSize(6)
        .fillColor("#9ca3af")
        .text(
          `Generated: ${generatedDate} | Page ${pageNum}`,
          50,
          footerTop + 28,
          {
            width: 495,
            align: "center",
            lineBreak: false,
          }
        );

      // Restore the drawing state
      doc.restore();

      addingFooter = false;
    };

    // Add footer to all pages after content is added
    doc.on("pageAdded", () => {
      const pageCount = doc.bufferedPageRange().count;
      addFooter(pageCount);
    });

    // Add footer to first page
    addFooter(1);

    // Finalize PDF
    doc.end();

    console.log(`✅ PDF report generated: ${filename}`);
  } catch (error) {
    console.error("Error generating PDF report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF report",
      error: error.message,
    });
  }
});

module.exports = router;
