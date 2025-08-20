// controllers/saleController.js
const Sale = require("../models/Sale");
const Timeslot = require("../models/Timeslot");
const Workday = require("../models/Workday");
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

    // Check user role
    const isOwner = organization.owner.toString() === req.user._id.toString();
    const userMember = organization.members.find(
      member => member.user.toString() === req.user._id.toString()
    );
    const isManager = userMember && (userMember.role === 'manager' || userMember.role === 'owner');

    // Get all sales for the organization with workday and timeslot population
    const sales = await Sale.find({ organization: organization._id })
      .sort({ createdAt: -1 })
      .populate("user", "name")
      .populate({
        path: "workday",
        select: "date timeslots",
        populate: {
          path: "timeslots",
          select: "startTime endTime date",
        },
      })
      .lean(); // Use lean for better performance

    // Add timeslot info to each sale based on timeslotId
    const enrichedSales = sales.map(sale => {
      if (sale.workday && sale.workday.timeslots) {
        const timeslot = sale.workday.timeslots.find(ts => 
          ts._id.toString() === sale.timeslotId.toString()
        );
        return {
          ...sale,
          timeslot: timeslot || null
        };
      }
      return sale;
    });

    res.json({ 
      success: true, 
      data: {
        sales: enrichedSales,
        isOwner,
        isManager
      }
    });
  } catch (error) {
    console.error("Get Sales Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Delete a sale (owner/manager only)
exports.deleteSale = async (req, res) => {
  try {
    const { saleId } = req.params;

    // Find the organization where user is owner or manager
    const organization = await Organization.findOne({
      $or: [
        { owner: req.user._id },
        { "members.user": req.user._id, "members.role": { $in: ["owner", "manager"] } }
      ]
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owners and managers can delete sales",
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

    await sale.deleteOne();

    res.json({ success: true, msg: "Sale deleted successfully" });
  } catch (error) {
    console.error("Delete Sale Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

exports.createSale = async (req, res) => {
  try {
    const { timeslotId, workdayId, name, number, address, price, details } = req.body;

    // Validate required fields
    if (!name?.trim() || !number?.trim() || !address?.trim() || !price || !details?.trim() || !timeslotId || !workdayId) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required",
      });
    }

    // Validate price
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        msg: "Price must be a valid positive number",
      });
    }

    // Find the workday and specific timeslot
    const workday = await Workday.findById(workdayId);
    if (!workday) {
      return res.status(404).json({ success: false, msg: "Workday not found" });
    }

    const timeslot = workday.timeslots.find(slot => slot._id.toString() === timeslotId);
    if (!timeslot) {
      return res.status(404).json({ success: false, msg: "Timeslot not found" });
    }

    // Get number of assigned cleaners (max sales allowed = number of cleaners)
    const assignedCleanersCount = timeslot.assignedUsers?.length || 0;

    if (assignedCleanersCount === 0) {
      return res.status(400).json({
        success: false,
        msg: "No cleaners assigned to this timeslot. Sales cannot be recorded.",
      });
    }

    // Check existing sales count for this timeslot
    const existingSalesCount = await Sale.countDocuments({
      workday: workdayId,
      timeslotId: timeslotId,
    });

    if (existingSalesCount >= assignedCleanersCount) {
      return res.status(400).json({
        success: false,
        msg: `Maximum of ${assignedCleanersCount} sale${
          assignedCleanersCount !== 1 ? "s" : ""
        } allowed for this timeslot. This timeslot is full.`,
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
      price: parsedPrice,
      details: details.trim(),
      salesRepName: req.user.name,
      user: req.user._id,
      workday: workdayId,
      timeslotId: timeslotId,
      organization: workday.organization,
    });

    await sale.save();

    res.json({ 
      success: true, 
      msg: "Sale recorded successfully", 
      data: { sale }
    });
  } catch (error) {
    console.error("Create Sale Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
