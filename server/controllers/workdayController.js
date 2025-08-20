// controllers/workdayController.js
const mongoose = require("mongoose");
const Workday = require("../models/Workday");
const Organization = require("../models/Organizations");
const Sale = require("../models/Sale");
const { validationResult } = require("express-validator");

// Get workdays for organization
exports.getWorkdays = async (req, res) => {
  try {
    const organization = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "User not associated with any organization",
      });
    }

    const { startDate, endDate } = req.query;
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    } else {
      // Default to show current week (7 days back to 7 days forward)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekBefore = new Date(today);
      weekBefore.setDate(today.getDate() - 7);
      const weekAfter = new Date(today);
      weekAfter.setDate(today.getDate() + 7);

      dateFilter = {
        date: {
          $gte: weekBefore,
          $lt: weekAfter,
        },
      };
    }

    const workdays = await Workday.find({
      organization: organization._id,
      isActive: true,
      ...dateFilter,
    })
      .populate("timeslots.assignedUsers.user", "name email")
      .sort({ date: 1 });

    const isOwner = organization.owner.toString() === req.user._id.toString();
    
    // Check if current user is a manager or owner
    const userMember = organization.members.find(
      member => member.user.toString() === req.user._id.toString()
    );
    const isManager = userMember && (userMember.role === 'manager' || userMember.role === 'owner');

    // Get sales information for each workday - optimized single query
    const workdayIds = workdays.map(w => w._id);
    const allSales = await Sale.find({
      workday: { $in: workdayIds }
    }).lean();

    // Group sales by workday and timeslot for efficient lookup
    const salesByWorkdayAndTimeslot = {};
    allSales.forEach(sale => {
      const workdayKey = sale.workday.toString();
      const timeslotKey = sale.timeslotId.toString();
      
      if (!salesByWorkdayAndTimeslot[workdayKey]) {
        salesByWorkdayAndTimeslot[workdayKey] = {};
      }
      if (!salesByWorkdayAndTimeslot[workdayKey][timeslotKey]) {
        salesByWorkdayAndTimeslot[workdayKey][timeslotKey] = [];
      }
      
      salesByWorkdayAndTimeslot[workdayKey][timeslotKey].push({
        id: sale._id,
        name: sale.name,
        price: sale.price,
        salesRepName: sale.salesRepName,
        createdAt: sale.createdAt,
      });
    });

    const workdaysWithSales = workdays.map(workday => {
      const workdayObj = workday.toObject();
      const workdayKey = workday._id.toString();

      // For each timeslot, get sales data from our lookup object
      workdayObj.timeslots = workdayObj.timeslots.map(timeslot => {
        const timeslotKey = timeslot._id.toString();
        const sales = salesByWorkdayAndTimeslot[workdayKey]?.[timeslotKey] || [];

        return {
          ...timeslot,
          salesCount: sales.length,
          sales,
        };
      });

      return workdayObj;
    });

    res.json({
      success: true,
      data: {
        workdays: workdaysWithSales,
        isOwner,
        isManager,
      }
    });
  } catch (error) {
    console.error("Get Workdays Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Create a new workday
exports.createWorkday = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation failed",
        errors: errors.array(),
      });
    }

    // Find organization where user is owner or member
    const organization = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });
    
    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "User not associated with any organization",
      });
    }

    // Check if user is owner or manager
    const isOwner = organization.owner.toString() === req.user._id.toString();
    const userMember = organization.members.find(
      member => member.user.toString() === req.user._id.toString()
    );
    const isManager = userMember && (userMember.role === 'manager' || userMember.role === 'owner');

    if (!isManager && !isOwner) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owners and managers can create workdays",
      });
    }

    const { date, timeslots, notes } = req.body;

    // Debug logging
    console.log(
      "Creating workday with timeslots:",
      JSON.stringify(timeslots, null, 2)
    );

    // Check if workday already exists for this date
    const existingWorkday = await Workday.findOne({
      organization: organization._id,
      date: new Date(date),
    });

    if (existingWorkday) {
      return res.status(400).json({
        success: false,
        msg: "Workday already exists for this date",
      });
    }

    // Validate timeslots
    if (!timeslots || !Array.isArray(timeslots) || timeslots.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "At least one timeslot is required",
      });
    }

    // Process timeslots to ensure proper format
    const processedTimeslots = timeslots.map((slot, index) => {
      console.log(`Processing slot ${index}:`, {
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxEmployees: slot.maxEmployees,
        assignedUsers: slot.assignedUsers,
      });

      const processedAssignedUsers = (slot.assignedUsers || []).map(
        (assignment) => {
          const userId = assignment.user._id || assignment.user;
          console.log(`Processing assignment:`, {
            assignment,
            extractedUserId: userId,
          });

          // Validate ObjectId
          if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error(`Invalid user ID: ${userId}`);
          }

          return {
            user: new mongoose.Types.ObjectId(userId),
            notes: assignment.notes || "",
          };
        }
      );

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxEmployees: slot.maxEmployees || 2,
        assignedUsers: processedAssignedUsers,
      };
    });

    console.log(
      "Final processed timeslots:",
      JSON.stringify(processedTimeslots, null, 2)
    );

    const workday = new Workday({
      organization: organization._id,
      date: new Date(date),
      timeslots: processedTimeslots,
      notes: notes || "",
    });

    console.log(
      "About to save workday:",
      JSON.stringify(workday.toObject(), null, 2)
    );

    try {
      await workday.save();
      console.log("Workday saved successfully");
    } catch (saveError) {
      console.error("Error saving workday:", saveError);
      throw saveError;
    }
    console.log(
      "Workday saved, before populate:",
      JSON.stringify(workday.toObject(), null, 2)
    );

    await workday.populate("timeslots.assignedUsers.user", "name email");
    console.log(
      "Workday after populate:",
      JSON.stringify(workday.toObject(), null, 2)
    );

    res.status(201).json({
      success: true,
      msg: "Workday created successfully",
      workday,
    });
  } catch (error) {
    console.error("Create Workday Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Update workday (add/remove timeslots, update notes)
exports.updateWorkday = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation failed",
        errors: errors.array(),
      });
    }

    // Find organization where user is owner or member
    const organization = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });
    
    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "User not associated with any organization",
      });
    }

    // Check if user is owner or manager
    const isOwner = organization.owner.toString() === req.user._id.toString();
    const userMember = organization.members.find(
      member => member.user.toString() === req.user._id.toString()
    );
    const isManager = userMember && (userMember.role === 'manager' || userMember.role === 'owner');

    if (!isManager && !isOwner) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owners and managers can update workdays",
      });
    }

    const { workdayId } = req.params;
    const { timeslots, notes } = req.body;

    const workday = await Workday.findOne({
      _id: workdayId,
      organization: organization._id,
    });

    if (!workday) {
      return res.status(404).json({
        success: false,
        msg: "Workday not found",
      });
    }

    if (timeslots) {
      const processedTimeslots = timeslots.map((slot) => ({
        ...slot,
        assignedUsers: slot.assignedUsers || [],
        maxEmployees: slot.maxEmployees || 2,
      }));
      workday.timeslots = processedTimeslots;
    }

    if (notes !== undefined) {
      workday.notes = notes;
    }

    await workday.save();
    await workday.populate("timeslots.assignedUsers.user", "name email");

    res.json({
      success: true,
      msg: "Workday updated successfully",
      workday,
    });
  } catch (error) {
    console.error("Update Workday Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Assign employee to a specific timeslot
exports.assignTimeslot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation failed",
        errors: errors.array(),
      });
    }

    // Find organization where user is owner or member
    const organization = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });
    
    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "User not associated with any organization",
      });
    }

    // Check if user is owner or manager
    const isOwner = organization.owner.toString() === req.user._id.toString();
    const userMember = organization.members.find(
      member => member.user.toString() === req.user._id.toString()
    );
    const isManager = userMember && (userMember.role === 'manager' || userMember.role === 'owner');

    if (!isManager && !isOwner) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owners and managers can assign timeslots",
      });
    }

    const { workdayId, timeslotId } = req.params;
    const { userId, notes, action } = req.body;

    const workday = await Workday.findOne({
      _id: workdayId,
      organization: organization._id,
    });

    if (!workday) {
      return res.status(404).json({
        success: false,
        msg: "Workday not found",
      });
    }

    const timeslot = workday.timeslots.id(timeslotId);
    if (!timeslot) {
      return res.status(404).json({
        success: false,
        msg: "Timeslot not found",
      });
    }

    if (action === "remove" && userId) {
      timeslot.assignedUsers = timeslot.assignedUsers.filter(
        (assignment) => assignment.user.toString() !== userId
      );

      await workday.save();
      await workday.populate("timeslots.assignedUsers.user", "name email");

      return res.json({
        success: true,
        msg: "User removed from timeslot successfully",
        workday,
      });
    }

    if (userId) {
      const isMember = organization.members.some(
        (member) => member.user.toString() === userId
      );

      if (!isMember) {
        return res.status(400).json({
          success: false,
          msg: "User is not a member of this organization",
        });
      }

      const isAlreadyAssigned = timeslot.assignedUsers.some(
        (assignment) => assignment.user.toString() === userId
      );

      if (isAlreadyAssigned) {
        return res.status(400).json({
          success: false,
          msg: "User is already assigned to this timeslot",
        });
      }

      if (timeslot.assignedUsers.length >= timeslot.maxEmployees) {
        return res.status(400).json({
          success: false,
          msg: `This timeslot is full (maximum ${timeslot.maxEmployees} employees)`,
        });
      }

      timeslot.assignedUsers.push({
        user: userId,
        notes: notes || "",
      });
    }

    await workday.save();
    await workday.populate("timeslots.assignedUsers.user", "name email");

    res.json({
      success: true,
      msg: userId
        ? "User assigned to timeslot successfully"
        : "Timeslot updated successfully",
      workday,
    });
  } catch (error) {
    console.error("Assign Timeslot Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Delete workday
exports.deleteWorkday = async (req, res) => {
  try {
    // Find organization where user is owner or member
    const organization = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });
    
    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "User not associated with any organization",
      });
    }

    // Check if user is owner or manager
    const isOwner = organization.owner.toString() === req.user._id.toString();
    const userMember = organization.members.find(
      member => member.user.toString() === req.user._id.toString()
    );
    const isManager = userMember && (userMember.role === 'manager' || userMember.role === 'owner');

    if (!isManager && !isOwner) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owners and managers can delete workdays",
      });
    }

    const { workdayId } = req.params;

    const workday = await Workday.findOneAndDelete({
      _id: workdayId,
      organization: organization._id,
    });

    if (!workday) {
      return res.status(404).json({
        success: false,
        msg: "Workday not found",
      });
    }

    // Clean up associated sales - remove all sales that reference this deleted workday
    await Sale.deleteMany({
      workday: workdayId,
      organization: organization._id,
    });

    res.json({
      success: true,
      msg: "Workday and associated sales deleted successfully",
    });
  } catch (error) {
    console.error("Delete Workday Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Delete specific timeslot from workday
exports.deleteTimeslot = async (req, res) => {
  try {
    // Find organization where user is owner or member
    const organization = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });
    
    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "User not associated with any organization",
      });
    }

    // Check if user is owner or manager
    const isOwner = organization.owner.toString() === req.user._id.toString();
    const userMember = organization.members.find(
      member => member.user.toString() === req.user._id.toString()
    );
    const isManager = userMember && (userMember.role === 'manager' || userMember.role === 'owner');

    if (!isManager && !isOwner) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owners and managers can delete timeslots",
      });
    }

    const { workdayId, timeslotId } = req.params;

    const workday = await Workday.findOne({
      _id: workdayId,
      organization: organization._id,
    });

    if (!workday) {
      return res.status(404).json({
        success: false,
        msg: "Workday not found",
      });
    }

    const timeslotIndex = workday.timeslots.findIndex(
      (slot) => slot._id.toString() === timeslotId
    );

    if (timeslotIndex === -1) {
      return res.status(404).json({
        success: false,
        msg: "Timeslot not found",
      });
    }

    workday.timeslots.splice(timeslotIndex, 1);
    await workday.save();
    await workday.populate("timeslots.assignedUsers.user", "name email");

    // Clean up associated sales - remove sales that reference this deleted timeslot
    await Sale.deleteMany({
      workday: workdayId,
      timeslotId: timeslotId,
      organization: organization._id,
    });

    res.json({
      success: true,
      msg: "Timeslot and associated sales deleted successfully",
      workday,
    });
  } catch (error) {
    console.error("Delete Timeslot Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
