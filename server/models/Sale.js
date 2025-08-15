// models/Sale.js
const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  number: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  details: { type: String, required: true, trim: true },
  salesRepName: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timeslot: { type: mongoose.Schema.Types.ObjectId, ref: "Timeslot", required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
}, { timestamps: true });

module.exports = mongoose.model("Sale", saleSchema);
