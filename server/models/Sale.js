// models/Sale.js
const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    number: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, "Please provide a valid phone number"],
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: [300, "Address cannot exceed 300 characters"],
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
      max: [999999.99, "Price cannot exceed $999,999.99"],
    },
    details: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Details cannot exceed 500 characters"],
    },
    salesRepName: {
      type: String,
      required: true,
      maxlength: [100, "Sales rep name cannot exceed 100 characters"],
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Support both old timeslot system and new workday system
    timeslot: { type: mongoose.Schema.Types.ObjectId, ref: "Timeslot" },
    workday: { type: mongoose.Schema.Types.ObjectId, ref: "Workday" },
    timeslotId: { type: mongoose.Schema.Types.ObjectId }, // For workday timeslots

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
  },
  {
    timestamps: true,
    // Add text search capabilities and virtuals
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance optimization
saleSchema.index({ organization: 1, createdAt: -1 }); // For organization sales listing
saleSchema.index({ timeslot: 1 }); // For timeslot sales count
saleSchema.index({ workday: 1, timeslotId: 1 }); // For workday timeslot sales
saleSchema.index({ user: 1, createdAt: -1 }); // For user sales history
saleSchema.index({ organization: 1, user: 1 }); // Compound index for user sales in org
saleSchema.index({ name: "text", details: "text" }); // Text search

// Virtual for formatted price
saleSchema.virtual("formattedPrice").get(function () {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(this.price);
});

module.exports = mongoose.model("Sale", saleSchema);
