const { Schema, model } = require("mongoose");
 
const userSchema = new Schema(
    {
        phoneNumber: {
            type: Number,
            unique: true,
            required: true,
            match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
        },
        fullName: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            default: "https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png",
        },
        gender: {
            type: String,
            enum: ["Male", "Female", "Others"],
            default: null,
        },
        email: {
            type: String,
            default: "",
            unique: true,
            match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
        },
        address: {
            type: String,
            default: "",
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
          }
    },
    { timestamps: true }
);
 
const userModel = model("User", userSchema);
module.exports = userModel;
 
 
 