const mongoose = require("mongoose");
 
const driverWalletSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'driverModel',
      required: true,
    },
    driverModel: {
      type: String,
      required: true,
      enum: ['Driver', 'DriverAuth'],
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
    },
    transactionType: {
      type: String,
      enum: ["Credit", "Debit", "Cancel", "Bonus", "Penalty", "RedeemRequest", "RedeemPaid"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: String,
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Completed",
    },
    notes: String,
    redemptionDetails: {
      redemptionMethod: {
        type: String,
        enum: ["UPI", "Bank"],
      },
      upiId: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      adminApproved: {
        type: Boolean,
        default: false,
      },
      adminApprovedAt: Date,
    },
  },
  { timestamps: true }
);
 
module.exports = mongoose.model("DriverWallet", driverWalletSchema);
 
 
 