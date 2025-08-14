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
        errors: errors.array(),
      });
    }

    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        msg: "Organization name is required",
      });
    }

    // Check if user already belongs to an organization
    const existingMembership = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        msg: "You already belong to an organization",
      });
    }

    // Generate unique code
    const code = await generateUniqueCode();

    // Create organization with owner as first member
    const organization = new Organization({
      name: name.trim(),
      description: description ? description.trim() : "",
      code,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "owner",
          joinedAt: new Date(),
        },
      ],
    });

    await organization.save();

    // Populate the owner and members for the response
    await organization.populate([
      { path: "owner", select: "name email" },
      { path: "members.user", select: "name email createdAt" },
    ]);

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
    const organization = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    }).populate([
      { path: "owner", select: "name email" },
      { path: "members.user", select: "name email createdAt" },
    ]);

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "No organization found for user",
      });
    }

    // Check if current user is the owner
    const isOwner =
      organization.owner._id.toString() === req.user._id.toString();

    res.json({
      success: true,
      organization,
      memberCount: organization.members.length,
      isOwner,
    });
  } catch (error) {
    console.error("Get Organization Error:", error);
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
        errors: errors.array(),
      });
    }

    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        msg: "Organization code is required",
      });
    }

    // Check if user already belongs to an organization
    const existingMembership = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        msg: "You already belong to an organization",
      });
    }

    // Find organization by code
    const organization = await Organization.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "Organization not found with this code",
      });
    }

    // Check if user is already a member (additional safety check)
    const alreadyMember = organization.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        msg: "You are already a member of this organization",
      });
    }

    // Add user to organization members with employee role
    organization.members.push({
      user: req.user._id,
      role: "employee",
      joinedAt: new Date(),
    });

    await organization.save();

    // Populate the response
    await organization.populate([
      { path: "owner", select: "name email" },
      { path: "members.user", select: "name email createdAt" },
    ]);

    res.json({
      success: true,
      msg: "Successfully joined organization",
      organization,
      userRole: "employee",
    });
  } catch (error) {
    console.error("Join Organization Error:", error);
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
        errors: errors.array(),
      });
    }

    const { name, description } = req.body;
    const organization = await Organization.findOne({ owner: req.user._id });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "Organization not found or you don't have permission",
      });
    }

    if (name && name.trim()) {
      organization.name = name.trim();
    }

    if (description !== undefined) {
      organization.description = description.trim();
    }

    await organization.save();

    // Populate after saving
    await organization.populate([
      { path: "owner", select: "name email" },
      { path: "members.user", select: "name email createdAt" },
    ]);

    res.json({
      success: true,
      msg: "Organization updated successfully",
      organization,
    });
  } catch (error) {
    console.error("Update Organization Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Remove member from organization (only owner allowed) - FIXED VERSION
exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    console.log("Attempting to remove member:", memberId);
    console.log("Request user:", req.user._id);

    // Find organization where current user is the owner
    const organization = await Organization.findOne({ owner: req.user._id });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "Organization not found or you don't have permission",
      });
    }

    console.log("Organization found:", organization._id);
    console.log("Organization members:", organization.members);

    // Don't allow owner to remove themselves
    if (memberId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        msg: "Owner cannot remove themselves from organization",
      });
    }

    // Find the member index - FIXED: Convert ObjectId to string for comparison
    const memberIndex = organization.members.findIndex(
      (member) => member.user.toString() === memberId
    );

    console.log("Member index found:", memberIndex);

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        msg: "Member not found in organization",
      });
    }

    // Remove the member
    organization.members.splice(memberIndex, 1);
    await organization.save();

    console.log("Member removed successfully");

    res.json({
      success: true,
      msg: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove Member Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Leave organization (for employees)
exports.leaveOrganization = async (req, res) => {
  try {
    const organization = await Organization.findOne({
      "members.user": req.user._id,
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "You are not a member of any organization",
      });
    }

    // Don't allow owner to leave (they must delete the organization)
    if (organization.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        msg: "Organization owner cannot leave. Please delete the organization instead.",
      });
    }

    // Remove user from members
    const memberIndex = organization.members.findIndex(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (memberIndex !== -1) {
      organization.members.splice(memberIndex, 1);
      await organization.save();
    }

    res.json({
      success: true,
      msg: "Successfully left the organization",
    });
  } catch (error) {
    console.error("Leave Organization Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Delete organization (only owner allowed)
exports.deleteOrganization = async (req, res) => {
  try {
    const organization = await Organization.findOne({ owner: req.user._id });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "Organization not found or you don't have permission",
      });
    }

    await Organization.findByIdAndDelete(organization._id);

    res.json({
      success: true,
      msg: "Organization deleted successfully",
    });
  } catch (error) {
    console.error("Delete Organization Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
