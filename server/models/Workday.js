const mongoose = require("mongoose");

const workdaySchema = new mongoose.Schema(
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
    isActive: {
      type: Boolean,
      default: true,
    },
    timeslots: [
      {
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
        maxEmployees: {
          type: Number,
          default: 2,
          min: 1,
          max: 10,
        },
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate workdays for same organization and date
workdaySchema.index({ organization: 1, date: 1 }, { unique: true });

// Index for faster queries (organization+date index is already covered by the unique index above)
workdaySchema.index({ "timeslots.assignedUsers.user": 1 });

module.exports = mongoose.model("Workday", workdaySchema);
