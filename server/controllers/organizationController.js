// controllers/organizationController.js

const Organization = require("../models/Organizations");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const crypto = require("crypto");

// Helper to generate a unique 6-character code
const generateUniqueCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = crypto.randomBytes(3).toString("hex").toUpperCase();
    const org = await Organization.findOne({ code });
    if (!org) exists = false;
  }

  return code;
};

// Create Organization
exports.createOrganization = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        msg: "Validation failed",
        errors: errors.array() 
      });
    }

    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        msg: "Organization name is required" 
      });
    }

    // Check if user already owns an organization
    const existingOrg = await Organization.findOne({ owner: req.user._id });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        msg: "You already own an organization",
      });
    }

    // Generate unique code
    const code = await generateUniqueCode();

    // Create organization
    const organization = new Organization({
      name: name.trim(),
      description: description ? description.trim() : "",
      code,
      owner: req.user._id,
      members: [req.user._id], // Add owner as first member
    });

    await organization.save();

    // Populate the owner field for the response
    await organization.populate("owner", "name email");

    res.status(201).json({
      success: true,
      msg: "Organization created successfully",
      organization,
    });
  } catch (error) {
    console.error("Create Organization Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Get organization details
exports.getOrganization = async (req, res) => {
  try {
    const organization = await Organization.findOne({ owner: req.user._id })
      .populate("owner", "name email")
      .populate("members", "name email createdAt");

    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        msg: "No organization found for user" 
      });
    }

    res.json({
      success: true,
      organization,
      memberCount: organization.members.length,
    });
  } catch (error) {
    console.error("Get Organization Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Update Organization (only owner allowed)
exports.updateOrganization = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        msg: "Validation failed",
        errors: errors.array() 
      });
    }

    const { name, description } = req.body;
    const organization = await Organization.findOne({ owner: req.user._id });

    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        msg: "Organization not found" 
      });
    }

    if (name && name.trim()) {
      organization.name = name.trim();
    }

    if (description !== undefined) {
      organization.description = description.trim();
    }

    await organization.save();
    await organization.populate("owner", "name email");

    res.json({ 
      success: true, 
      msg: "Organization updated successfully", 
      organization 
    });
  } catch (error) {
    console.error("Update Organization Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Delete Organization (only owner allowed)
exports.deleteOrganization = async (req, res) => {
  try {
    const organization = await Organization.findOne({ owner: req.user._id });

    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        msg: "Organization not found" 
      });
    }

    await Organization.findByIdAndDelete(organization._id);

    res.json({ 
      success: true, 
      msg: "Organization deleted successfully" 
    });
  } catch (error) {
    console.error("Delete Organization Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Join Organization by code
exports.joinOrganization = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        msg: "Validation failed",
        errors: errors.array() 
      });
    }

    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ 
        success: false, 
        msg: "Organization code is required" 
      });
    }

    // Check if user already belongs to an organization
    const existingMembership = await Organization.findOne({ 
      members: req.user._id 
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        msg: "You already belong to an organization",
      });
    }

    // Find organization by code
    const organization = await Organization.findOne({ 
      code: code.trim().toUpperCase() 
    });

    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        msg: "Organization not found with this code" 
      });
    }

    // Add user to organization members
    organization.members.push(req.user._id);
    await organization.save();

    await organization.populate("owner", "name email");

    res.json({
      success: true,
      msg: "Successfully joined organization",
      organization,
    });
  } catch (error) {
    console.error("Join Organization Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Remove member from organization (only owner allowed)
exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const organization = await Organization.findOne({ owner: req.user._id });

    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        msg: "Organization not found" 
      });
    }

    // Don't allow owner to remove themselves
    if (memberId === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        msg: "Owner cannot remove themselves from organization" 
      });
    }

    // Remove member from organization
    organization.members = organization.members.filter(
      member => member.toString() !== memberId
    );

    await organization.save();

    res.json({ 
      success: true, 
      msg: "Member removed successfully" 
    });
  } catch (error) {
    console.error("Remove Member Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
