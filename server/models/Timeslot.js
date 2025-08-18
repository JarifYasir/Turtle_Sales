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
    assignedUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: {
          type: String,
          trim: true,
          maxlength: [200, "Notes cannot exceed 200 characters"],
          default: "",
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    maxEmployees: {
      type: Number,
      default: 2,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate timeslots for same organization, date, and time
timeslotSchema.index(
  { organization: 1, date: 1, startTime: 1 },
  { unique: true }
);

// Index for faster queries (organization+date index is covered by the compound index above)
timeslotSchema.index({ "assignedUsers.user": 1 });

module.exports = mongoose.model("Timeslot", timeslotSchema);
