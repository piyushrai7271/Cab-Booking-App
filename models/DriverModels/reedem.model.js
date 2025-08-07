const mongoose = require("mongoose");
 
const redemptionRequestSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DriverAuth",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  redemptionMethod: {
    type: String,
    enum: ["UPI", "Bank Transfer"],
    required: true,
  },
  upiId: {
    type: String,
    required: function() { return this.redemptionMethod === "UPI"; }
  },
  bankName: {
    type: String,
    required: function() { return this.redemptionMethod === "Bank Transfer"; }
  },
  accountNumber: {
    type: String,
    required: function() { return this.redemptionMethod === "Bank Transfer"; }
  },
  ifscCode: {
    type: String,
    required: function() { return this.redemptionMethod === "Bank Transfer"; }
  },
  accountHolderName: {
    type: String,
    required: function() { return this.redemptionMethod === "Bank Transfer"; }
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Processed"],
    default: "Pending"
  },
  processedAt: Date,
  adminNotes: String
}, { timestamps: true });
 
module.exports = mongoose.model("RedemptionRequest", redemptionRequestSchema);