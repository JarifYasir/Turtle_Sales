// routes/workdayRoutes.js
const express = require("express");
const router = express.Router();
const {
  getWorkdays,
  createWorkday,
  updateWorkday,
  assignTimeslot,
  deleteWorkday,
  deleteTimeslot,
} = require("../controllers/workdayController");
const auth = require("../middleware/auth");
const { body, param } = require("express-validator");

// Validation middleware
const validateWorkdayCreation = [
  body("date").isISO8601().withMessage("Valid date is required"),
  body("timeslots")
    .isArray({ min: 1 })
    .withMessage("At least one timeslot is required"),
  body("timeslots.*.startTime")
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Valid start time is required (HH:mm format)"),
  body("timeslots.*.endTime")
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Valid end time is required (HH:mm format)"),
  body("timeslots.*.maxEmployees")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Max employees must be between 1 and 10"),
];

const validateWorkdayUpdate = [
  param("workdayId").isMongoId().withMessage("Valid workday ID is required"),
  body("timeslots")
    .optional()
    .isArray()
    .withMessage("Timeslots must be an array"),
  body("timeslots.*.startTime")
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Valid start time is required (HH:mm format)"),
  body("timeslots.*.endTime")
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Valid end time is required (HH:mm format)"),
  body("timeslots.*.maxEmployees")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Max employees must be between 1 and 10"),
];

const validateAssignment = [
  param("workdayId").isMongoId().withMessage("Valid workday ID is required"),
  param("timeslotId").isMongoId().withMessage("Valid timeslot ID is required"),
  body("userId")
    .optional()
    .isMongoId()
    .withMessage("Valid user ID is required"),
  body("notes")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Notes cannot exceed 200 characters"),
  body("action")
    .optional()
    .isIn(["assign", "remove"])
    .withMessage("Action must be 'assign' or 'remove'"),
];

// Routes
router.get("/", auth, getWorkdays);
router.post("/", auth, validateWorkdayCreation, createWorkday);
router.put("/:workdayId", auth, validateWorkdayUpdate, updateWorkday);
router.put(
  "/:workdayId/timeslots/:timeslotId/assign",
  auth,
  validateAssignment,
  assignTimeslot
);
router.delete("/:workdayId", auth, deleteWorkday);
router.delete("/:workdayId/timeslots/:timeslotId", auth, deleteTimeslot);

module.exports = router;
