const express = require("express");
const router = express.Router();
const Station = require("../models/Station");
const { authenticate, authorize } = require("../middleware/auth");

// Get all stations
router.get("/", authenticate, async (req, res) => {
  try {
    const stations = await Station.find()
      .select('stationName _id address province stationType')
      .sort({ stationName: 1 });
    
    res.status(200).json({
      success: true,
      count: stations.length,
      data: stations
    });
  } catch (error) {
    console.error("Error fetching stations:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching stations",
      error: error.message
    });
  }
});

// Get station by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: station
    });
  } catch (error) {
    console.error("Error fetching station:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching station",
      error: error.message
    });
  }
});

module.exports = router;
