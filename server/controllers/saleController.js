// controllers/saleController.js
const Sale = require("../models/Sale");
const Timeslot = require("../models/Timeslot");
const Organization = require("../models/Organizations");

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

    // Find the associated timeslot and increase available spots
    const timeslot = await Timeslot.findById(sale.timeslot);
    if (timeslot) {
      timeslot.maxEmployees = timeslot.maxEmployees + 1;
      await timeslot.save();
    }

    await sale.deleteOne();

    res.json({ success: true, msg: "Sale deleted successfully" });
  } catch (error) {
    console.error("Delete Sale Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

exports.createSale = async (req, res) => {
  try {
    const { timeslotId, name, number, address, price, details } = req.body;

    const timeslot = await Timeslot.findById(timeslotId);
    if (!timeslot) {
      return res
        .status(404)
        .json({ success: false, msg: "Timeslot not found" });
    }

    // Check existing sales count for this timeslot
    const existingSalesCount = await Sale.countDocuments({
      timeslot: timeslotId,
    });

    // Get number of assigned cleaners (max sales allowed = number of cleaners)
    const assignedCleanersCount = timeslot.assignedUsers
      ? timeslot.assignedUsers.length
      : 0;

    if (assignedCleanersCount === 0) {
      return res.status(400).json({
        success: false,
        msg: "No cleaners assigned to this timeslot. Sales cannot be recorded.",
      });
    }

    if (existingSalesCount >= assignedCleanersCount) {
      return res.status(400).json({
        success: false,
        msg: `Maximum of ${assignedCleanersCount} sale${
          assignedCleanersCount !== 1 ? "s" : ""
        } allowed for this timeslot (${assignedCleanersCount} cleaner${
          assignedCleanersCount !== 1 ? "s" : ""
        } assigned). This timeslot is full.`,
      });
    }

    if (timeslot.maxEmployees <= 0) {
      return res
        .status(400)
        .json({ success: false, msg: "No spots available" });
    }

    // Verify user is member of the organization
    const organization = await Organization.findOne({
      _id: timeslot.organization,
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
      organization: timeslot.organization,
    });

    await sale.save();

    // Reduce available spots
    timeslot.maxEmployees = timeslot.maxEmployees - 1;
    await timeslot.save();

    res.json({ success: true, msg: "Sale recorded successfully", sale });
  } catch (error) {
    console.error("Create Sale Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
