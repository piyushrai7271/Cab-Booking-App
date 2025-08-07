const mongoose = require("mongoose");

// ✅ Sub Schema for pickup later
const pickupLaterSchema = new mongoose.Schema(
  {
    pickupTime: {
      type: String,
      required: true,
    },
    pickupDate: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// ✅ Sub Schema for others
const forOthersSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    relationship: {
      type: String,
      enum: ["Friend", "Relative", "Mother", "Father", "Sibiling"],
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// ✅ Main Rental Ride Schema
const rentalRideSchema = new mongoose.Schema(
  {
    rideBookingId: {
      type: String,
      required: true,
    },
    rideType: {
      type: String,
      enum: ["One Way", "Rental", "OutStation"],
    },
    pickups: {
      type: String,
      enum: ["Pickup Now", "Pickup Later"],
      default: "Pickup Now",
      required: true,
    },
    pickupLater: {
      type: pickupLaterSchema,
      required: function () {
        return this.pickups === "Pickup Later";
      },
    },
    userFor: {
      type: String,
      enum: ["For Me", "For Others"],
      required: true,
    },
    forOthers: {
      type: forOthersSchema,
      required: function () {
        return this.userFor === "For Others";
      },
    },
    pickupLocation: {
      type: String,
      required: true,
    },
    dropLocation: {
      type: String,
    },
    enterFirstStop: {
      type: String,
    },
    enterAnotherStop: {
      type: String,
    },
    rideStatus: {
      type: String,
      enum: ["Pending", "Ongoing", "Completed", "Cancelled"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Online"]
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Advance Paid", "Paid", "Failed", "Refunded"],
      default: "Unpaid",
    },

    selectedPackage: {
      type: String,
      required: function () {
        return ["Rental", "OutStation"].includes(this.rideType);
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cabDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cab",
      // required: true,
    },
    distance: {
      type: String,
    },
    duration: {
      type: String,
    },
    fareEstimate: {
      type: mongoose.Schema.Types.Mixed,
      // required: true,
    },
    bookingType: {
      type: String,
      default: "Online Booking",
    },
    couponCode: {
      type: String,
      ref: "ReferEarn",
    },
    paymentLinkId: String,
    paymentLinkStatus: String,
    razorpayPaymentId: String,
    razorpayOrderId: String,
    transactionId: String,
    cancelReason: {
      type: String,
      enum: ["Plan Change", "High Price", "Others"],
    },
    OtherReason: {
      type: String,
      default: "",
    },
    
    ratings:{
      type:Number,
      default:0
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverAuth",
      default: null,
    },
    deniedByDrivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DriverAuth", // or 'DriverAuth' depending on your model
      },
    ],
    otp: {
      type: String,
    }, 
  },
  { timestamps: true }
);

const RentalRide = mongoose.model("Ride", rentalRideSchema);
module.exports = RentalRide;
