// routes/saleRoutes.js
const express = require("express");
const router = express.Router();
const { 
  createSale, 
  getSales, 
  deleteSale,
  getLeaderboard,
  getWeeklySalesReport,
  cleanupOrphanedSales
} = require("../controllers/saleController");
const authMiddleware = require("../middleware/auth");

// Create a new sale
router.post("/", authMiddleware, createSale);

// Get all sales for organization
router.get("/", authMiddleware, getSales);

// Get leaderboard for organization
router.get("/leaderboard", authMiddleware, getLeaderboard);

// Get weekly sales report for employee paystub
router.get("/weekly-report", authMiddleware, getWeeklySalesReport);

// Cleanup orphaned sales (organization owners only)
router.post("/cleanup", authMiddleware, cleanupOrphanedSales);

// Delete a sale (manager only)
router.delete("/:saleId", authMiddleware, deleteSale);

module.exports = router;
