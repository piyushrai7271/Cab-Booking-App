const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel", // Will dynamically reference either 'User' or 'Driver'
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "userModel", // Will dynamically reference either 'User' or 'Driver'
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["User", "Driver"], // Must match the model names exactly
    },
    receiverModel: {
      type: String,
      required: true,
      enum: ["User", "Driver"],
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Chat", ChatSchema);
