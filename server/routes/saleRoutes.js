// routes/saleRoutes.js
const express = require("express");
const router = express.Router();
const {
  createSale,
  getSales,
  deleteSale,
  getWeeklySalesReport,
  cleanupOrphanedSales,
} = require("../controllers/saleController");
const authMiddleware = require("../middleware/auth");

// Create a new sale
router.post("/", authMiddleware, createSale);

// Get weekly sales report for employee paystub (must come before generic GET /)
router.get("/weekly-report", authMiddleware, getWeeklySalesReport);

// Cleanup orphaned sales (owner only)
router.post("/cleanup", authMiddleware, cleanupOrphanedSales);

// Get all sales for organization
router.get("/", authMiddleware, getSales);

// Delete a sale (manager only)
router.delete("/:saleId", authMiddleware, deleteSale);

module.exports = router;
