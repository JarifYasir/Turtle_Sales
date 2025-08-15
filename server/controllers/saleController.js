// controllers/saleController.js (UPDATED - ANY EMPLOYEE CAN RECORD SALES)
const Sale = require("../models/Sale");
const Timeslot = require("../models/Timeslot");
const Organization = require("../models/Organizations");

exports.createSale = async (req, res) => {
  try {
    const { timeslotId, name, number, address, price, details } = req.body;

    const timeslot = await Timeslot.findById(timeslotId);
    if (!timeslot) {
      return res.status(404).json({ success: false, msg: "Timeslot not found" });
    }

    if (timeslot.maxEmployees <= 0) {
      return res.status(400).json({ success: false, msg: "No spots available" });
    }

    // Verify user is member of the organization
    const organization = await Organization.findOne({
      _id: timeslot.organization,
      $or: [
        { owner: req.user._id },
        { "members.user": req.user._id }
      ],
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
