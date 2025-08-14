const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const organizationController = require("../controllers/organizationController");

const router = express.Router();

// Validation for creating/updating organization name
const organizationNameValidation = body("name")
  .trim()
  .notEmpty()
  .withMessage("Organization name is required")
  .isLength({ min: 2, max: 100 })
  .withMessage("Organization name must be 2 to 100 characters");

// Validation for organization code
const organizationCodeValidation = body("code")
  .trim()
  .notEmpty()
  .withMessage("Organization code is required")
  .isLength({ min: 6, max: 6 })
  .withMessage("Organization code must be exactly 6 characters");

// Create organization route
router.post(
  "/create",
  auth,
  organizationNameValidation,
  organizationController.createOrganization
);

// Join organization route
router.post(
  "/join",
  auth,
  organizationCodeValidation,
  organizationController.joinOrganization
);

// Get organization details
router.get("/", auth, organizationController.getOrganization);

// Update organization details (owner only)
router.put(
  "/",
  auth,
  organizationNameValidation.optional(),
  organizationController.updateOrganization
);

// Delete organization (owner only)
router.delete("/", auth, organizationController.deleteOrganization);

// Remove member from organization (owner only)
router.delete("/member/:memberId", auth, organizationController.removeMember);

// Leave organization (employees only)
router.post("/leave", auth, organizationController.leaveOrganization);

module.exports = router;
