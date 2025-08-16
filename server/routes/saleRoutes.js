// routes/saleRoutes.js
const express = require("express");
const router = express.Router();
const { 
  createSale, 
  getSales, 
  deleteSale 
} = require("../controllers/saleController");
const authMiddleware = require("../middleware/auth");

// Create a new sale
router.post("/", authMiddleware, createSale);

// Get all sales for organization
router.get("/", authMiddleware, getSales);

// Delete a sale (manager only)
router.delete("/:saleId", authMiddleware, deleteSale);

module.exports = router;
