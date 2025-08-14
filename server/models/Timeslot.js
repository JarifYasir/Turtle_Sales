const mongoose = require("mongoose");

const timeslotSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // Format: "HH:mm" (e.g., "09:00")
      required: true,
    },
    endTime: {
      type: String, // Format: "HH:mm" (e.g., "11:00")
      required: true,
    },
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, "Notes cannot exceed 200 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate timeslots for same organization, date, and time
timeslotSchema.index({ organization: 1, date: 1, startTime: 1 }, { unique: true });

// Index for faster queries
timeslotSchema.index({ organization: 1, date: 1 });
timeslotSchema.index({ assignedUser: 1 });

module.exports = mongoose.model("Timeslot", timeslotSchema);
