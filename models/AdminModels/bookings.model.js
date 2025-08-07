const mongoose = require("mongoose");
 
const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // 📌 Customer Info
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerMobileNo: {
      type: Number,
      required: true,
      match: [/^[0-9]{10}$/, "Customer contact must be 10 digits"],
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Customer email is invalid"],
    },
 
    // 📌 Driver Info
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverMobileNo: {
      type: Number,
      required: true,
      match: [/^[0-9]{10}$/, " Contact Number must be 10 digits long"],
    },
    driverEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Driver email is invalid"],
    },
    
 
    // 📌 Booking Info
    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },
    stoppage: {
      type: String,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    typeOfTaxi: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: String,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    modeOfPayment: {
      type: String,
      enum: ["Cash", "Online"]
    },
    advancePayment: {
      type: String,
      default: "0.0",
    },
    advancePaymentDate: {
      type: String,
      default: "",
    },
    finalPayment: {
      type: String,
      default: "0.0",
    },
    finalPaymentDate: {
      type: String,
      default: "",
    },
    // 📌 New Fields from Bookings List
    bookingType: {
      type: String,
      enum: ["Online Booking", "Advance Booking"],
      default: "Advance Booking",
    },
    bookingTime: {
      type: String, // or use Date with time-only formatting if you want proper time logic
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ["Dropped", "In Process", "Cancelled"],
      default: "In Process",
    },
 
    // 📌 System-level
    isDeleted: {
      type: Boolean,
      default: false,
    },

    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
