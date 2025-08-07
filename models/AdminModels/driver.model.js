const mongoose = require("mongoose");

const GuarantorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  licenseNo: { type: String, required: true },
});

const DriverSchema = new mongoose.Schema(
  {
    driverName: { type: String, required: true },
    mobileNo: {
      type: Number,
      unique: true,
      required: true,
      match: [/^[0-9]{10}$/, "Mobile number must be 10 digits"],
    },
    city: { type: String, required: true },
    address: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is Required"],
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },

    image: { type: String },
    aadharNumber: { type: String, unique: true, required: true },
    aadharCardImage: { type: String,  },

    panCardNumber: { type: String, unique: true, },
    panCardImage: { type: String, },

    licenceCardImage: { type: String, },
    vehicleRCImage: { type: String,  },
    otherDocuments: {
      type: [String],
      default: [],
    },

    guarantor1: { type: GuarantorSchema, required: true },
    guarantor2: { type: GuarantorSchema, required: true },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    blockedStatus: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Driver", DriverSchema);
