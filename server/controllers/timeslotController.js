const Timeslot = require("../models/Timeslot");
const Organization = require("../models/Organizations");
const { validationResult } = require("express-validator");

// Helper function to generate 2-hour timeslots for a day
const generateDayTimeslots = (date) => {
  const slots = [];
  const startHours = [10, 12, 14, 16, 18]; // 10am to 8pm, 2-hour slots

  startHours.forEach((hour) => {
    const startTime = `${hour.toString().padStart(2, "0")}:00`;
    const endHour = hour + 2;
    const endTime = `${endHour.toString().padStart(2, "0")}:00`;

    slots.push({
      date: new Date(date),
      startTime,
      endTime,
      assignedUsers: [],
      maxEmployees: 2,
    });
  });

  return slots;
};

// Generate timeslots for the next week
exports.generateTimeslots = async (req, res) => {
  try {
    // Check if user is organization owner
    const organization = await Organization.findOne({ owner: req.user._id });
    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owners can generate timeslots",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timeslotsToCreate = [];

    // Generate timeslots for next 7 days
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      const daySlots = generateDayTimeslots(currentDate);
      daySlots.forEach((slot) => {
        timeslotsToCreate.push({
          ...slot,
          organization: organization._id,
        });
      });
    }

    // Use insertMany with ordered: false to skip duplicates
    try {
      await Timeslot.insertMany(timeslotsToCreate, { ordered: false });
    } catch (error) {
      // Ignore duplicate key errors (E11000)
      if (error.code !== 11000) {
        throw error;
      }
    }

    res.json({
      success: true,
      msg: "Timeslots generated successfully",
    });
  } catch (error) {
    console.error("Generate Timeslots Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Get timeslots for organization
exports.getTimeslots = async (req, res) => {
  try {
    // Find user's organization
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
      // Default to next 7 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      dateFilter = {
        date: {
          $gte: today,
          $lt: nextWeek,
        },
      };
    }

    const timeslots = await Timeslot.find({
      organization: organization._id,
      isActive: true,
      ...dateFilter,
    })
      .populate("assignedUsers.user", "name email")
      .sort({ date: 1, startTime: 1 });

    // Check if user is owner
    const isOwner = organization.owner.toString() === req.user._id.toString();

    res.json({
      success: true,
      timeslots,
      isOwner,
    });
  } catch (error) {
    console.error("Get Timeslots Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Assign user to timeslot
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

    // Check if user is organization owner
    const organization = await Organization.findOne({ owner: req.user._id });
    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owners can assign timeslots",
      });
    }

    const { timeslotId } = req.params;
    const { userId, notes, action } = req.body; // action can be 'assign' or 'remove'

    const timeslot = await Timeslot.findOne({
      _id: timeslotId,
      organization: organization._id,
    });

    if (!timeslot) {
      return res.status(404).json({
        success: false,
        msg: "Timeslot not found",
      });
    }

    if (action === "remove" && userId) {
      // Remove user from timeslot
      timeslot.assignedUsers = timeslot.assignedUsers.filter(
        (assignment) => assignment.user.toString() !== userId
      );
      await timeslot.save();

      await timeslot.populate("assignedUsers.user", "name email");

      return res.json({
        success: true,
        msg: "User removed from timeslot successfully",
        timeslot,
      });
    }

    // If userId is provided, check if user is a member of the organization
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

      // Check if user is already assigned to this timeslot
      const isAlreadyAssigned = timeslot.assignedUsers.some(
        (assignment) => assignment.user.toString() === userId
      );

      if (isAlreadyAssigned) {
        return res.status(400).json({
          success: false,
          msg: "User is already assigned to this timeslot",
        });
      }

      // Check if timeslot is full
      if (timeslot.assignedUsers.length >= timeslot.maxEmployees) {
        return res.status(400).json({
          success: false,
          msg: `This timeslot is full (maximum ${timeslot.maxEmployees} employees)`,
        });
      }

      // Add user to timeslot
      timeslot.assignedUsers.push({
        user: userId,
        notes: notes || "",
      });
    }

    await timeslot.save();
    await timeslot.populate("assignedUsers.user", "name email");

    res.json({
      success: true,
      msg: userId
        ? "User assigned to timeslot successfully"
        : "Timeslot updated successfully",
      timeslot,
    });
  } catch (error) {
    console.error("Assign Timeslot Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Delete timeslot
exports.deleteTimeslot = async (req, res) => {
  try {
    // Check if user is organization owner
    const organization = await Organization.findOne({ owner: req.user._id });
    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owners can delete timeslots",
      });
    }

    const { timeslotId } = req.params;

    const timeslot = await Timeslot.findOneAndDelete({
      _id: timeslotId,
      organization: organization._id,
    });

    if (!timeslot) {
      return res.status(404).json({
        success: false,
        msg: "Timeslot not found",
      });
    }

    res.json({
      success: true,
      msg: "Timeslot deleted successfully",
    });
  } catch (error) {
    console.error("Delete Timeslot Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
