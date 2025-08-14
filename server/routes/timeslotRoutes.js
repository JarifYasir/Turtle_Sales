const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const timeslotController = require("../controllers/timeslotController");

const router = express.Router();

// Validation for assigning timeslot
const assignTimeslotValidation = [
  body("userId").optional().isMongoId().withMessage("Invalid user ID"),
  body("notes").optional().trim().isLength({ max: 200 }).withMessage("Notes cannot exceed 200 characters"),
];

// Generate timeslots for the next week
router.post("/generate", auth, timeslotController.generateTimeslots);

// Get timeslots
router.get("/", auth, timeslotController.getTimeslots);

// Assign/unassign user to timeslot
router.put("/assign/:timeslotId", auth, assignTimeslotValidation, timeslotController.assignTimeslot);

// Delete timeslot
router.delete("/:timeslotId", auth, timeslotController.deleteTimeslot);

module.exports = router;
