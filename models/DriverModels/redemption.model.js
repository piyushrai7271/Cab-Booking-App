const mongoose = require("mongoose");
 
const redemptionRequestSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "driverModel",
      required: true,
      index: true
    },
    driverModel: {
      type: String,
      required: true,
      enum: ["Driver", "DriverAuth"]
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    redeemStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Processed"],
      default: "Pending"
    },
    redemptionMethod: {
      type: String,
      required: true,
      enum: ["UPI", "BankTransfer"]
    },
    upiDetails: {
      upiId: {
        type: String,
        required: function() { return this.redemptionMethod === "UPI"; }
      }
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String
    },
    adminNotes: String,
    processedAt: Date,
    walletTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverWallet"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
 
// Indexes
redemptionRequestSchema.index({ driverId: 1, status: 1 });
redemptionRequestSchema.index({ createdAt: -1 });
 
module.exports = mongoose.model("RedemptionRequest", redemptionRequestSchema);
 