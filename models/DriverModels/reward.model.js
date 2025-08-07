 
const mongoose = require("mongoose");
 
const driverRewardSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "driverModel",
      required: true,
      unique: true,
    },
    driverModel: {
      type: String,
      required: true,
      enum: ["Driver", "DriverAuth"],
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastBonusGiven: Date,
    lastPenaltyApplied: Date,
    achievements: {
      totalRidesCompleted: { type: Number, default: 0 },
      consecutiveDays: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
 
// Indexes
driverRewardSchema.index({ driverId: 1 }, { unique: true });
 
module.exports = mongoose.model("DriverReward", driverRewardSchema);
 