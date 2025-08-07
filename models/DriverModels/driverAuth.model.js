
const mongoose = require("mongoose");

const DriverAuthSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    mobileNo: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Others"],
    },
    DOB: {
      type: Date,
    },
    vehicleType: {
      type: String,
    },
    registrationNo: {
      type: String,
    },
    registrationImage: {
      type: String,
    },
    drivingLicenseNo: {
      type: String,
    },
    licenceCardImage: { type: String },

    aadharNumber: {
      type: String,
    },
    aadharCardImage: {
      type: String,
    },
    image: {
      type: String,
      default:
        "https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png",
    },
    upiId: {
      type: String,
    },
    vehicleImage: {
      type: String,
    },
    otp: {
      type: Number,
    },
    otpExpiresAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    blockedStatus: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DriverAuth", DriverAuthSchema);
