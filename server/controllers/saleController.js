// controllers/saleController.js
const Sale = require("../models/Sale");
const Timeslot = require("../models/Timeslot");

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

    const sale = new Sale({
      name, number, address, price: parseFloat(price), details,
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
