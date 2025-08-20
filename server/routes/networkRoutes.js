const express = require("express");
const { getNetworkIP } = require("../config/environment");

const router = express.Router();

/**
 * Get network configuration for dynamic client setup
 */
router.get("/config", (req, res) => {
  try {
    const networkIP = getNetworkIP();
    const port = process.env.PORT || 3000;
    
    const config = {
      localhost: `http://localhost:${port}/api/v1`,
      network: networkIP ? `http://${networkIP}:${port}/api/v1` : null,
      port,
      networkIP,
      environment: process.env.NODE_ENV || "development"
    };

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error("Error getting network config:", error);
    res.status(500).json({
      success: false,
      msg: "Failed to get network configuration"
    });
  }
});

/**
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
