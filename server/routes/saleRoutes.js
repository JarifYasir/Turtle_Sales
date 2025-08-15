// routes/saleRoutes.js
const express = require("express");
const router = express.Router();
const { createSale } = require("../controllers/saleController");
const authMiddleware = require("../middleware/auth");
router.post("/", authMiddleware, createSale);

module.exports = router;
