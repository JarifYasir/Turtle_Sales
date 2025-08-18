// controllers/saleController.js
const Sale = require("../models/Sale");
const Timeslot = require("../models/Timeslot");
const Organization = require("../models/Organizations");
const Workday = require("../models/Workday");

// Get all sales for organization
exports.getSales = async (req, res) => {
  try {
    // Find the organization the user belongs to
    const organization = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "User not associated with any organization",
      });
    }

    // Get all sales for the organization
    const sales = await Sale.find({ organization: organization._id })
      .sort({ createdAt: -1 })
      .populate("user", "name")
      .populate({
        path: "timeslot",
        select: "date startTime endTime",
      });

    res.json({ success: true, sales });
  } catch (error) {
    console.error("Get Sales Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Delete a sale (manager only)
exports.deleteSale = async (req, res) => {
  try {
    const { saleId } = req.params;

    // Find the organization where user is owner
    const organization = await Organization.findOne({
      owner: req.user._id,
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owners can delete sales",
      });
    }

    // Find and delete the sale
    const sale = await Sale.findOne({
      _id: saleId,
      organization: organization._id,
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        msg: "Sale not found",
      });
    }

    // Note: We don't need to modify timeslot.maxEmployees when deleting a sale
    // Sales availability is calculated dynamically based on assignedUsers count vs actual sales count

    await sale.deleteOne();

    res.json({ success: true, msg: "Sale deleted successfully" });
  } catch (error) {
    console.error("Delete Sale Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

exports.createSale = async (req, res) => {
  try {
    const { timeslotId, workdayId, name, number, address, price, details } =
      req.body;

    // Find the workday and the specific timeslot within it
    const workday = await Workday.findById(workdayId);
    if (!workday) {
      return res.status(404).json({ success: false, msg: "Workday not found" });
    }

    const timeslot = workday.timeslots.id(timeslotId);
    if (!timeslot) {
      return res
        .status(404)
        .json({ success: false, msg: "Timeslot not found" });
    }

    // Get number of assigned cleaners (x = max sales allowed)
    const assignedCleanersCount = timeslot.assignedUsers
      ? timeslot.assignedUsers.length
      : 0;

    if (assignedCleanersCount === 0) {
      return res.status(400).json({
        success: false,
        msg: "No cleaners assigned to this timeslot. Sales cannot be recorded.",
      });
    }

    // Check existing sales count for this timeslot
    const existingSalesCount = await Sale.countDocuments({
      timeslot: timeslotId,
    });

    // Calculate remaining sales slots (y = sales still allowed)
    const remainingSalesSlots = assignedCleanersCount - existingSalesCount;

    if (remainingSalesSlots <= 0) {
      return res.status(400).json({
        success: false,
        msg: `Maximum of ${assignedCleanersCount} sale${
          assignedCleanersCount !== 1 ? "s" : ""
        } allowed for this timeslot (${assignedCleanersCount} cleaner${
          assignedCleanersCount !== 1 ? "s" : ""
        } assigned). This timeslot is full.`,
      });
    }

    // Verify user is member of the organization
    const organization = await Organization.findOne({
      _id: workday.organization,
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "You are not a member of this organization",
      });
    }

    const sale = new Sale({
      name: name.trim(),
      number: number.trim(),
      address: address.trim(),
      price: parseFloat(price),
      details: details.trim(),
      salesRepName: req.user.name,
      user: req.user._id,
      timeslot: timeslotId,
      workday: workdayId,
      timeslotId: timeslotId, // Store for workday system
      organization: workday.organization,
    });

    await sale.save();

    // Note: We don't modify timeslot.maxEmployees as it represents total capacity
    // Sales availability is calculated dynamically based on assignedUsers count vs actual sales count

    res.json({ success: true, msg: "Sale recorded successfully", sale });
  } catch (error) {
    console.error("Create Sale Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
