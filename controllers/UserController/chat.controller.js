const Chat = require("../../models/UserModels/chat.model");
const User = require("../../models/UserModels/user.model");
const Driver = require("../../models/AdminModels/driver.model");

const createChatMessage = async (req, res) => {
  try {
    const { senderId, receiverId, senderModel, receiverModel, message } =
      req.body;

    // ✅ Validate required fields
    if (
      !senderId ||
      !receiverId ||
      !senderModel ||
      !receiverModel ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (senderId, receiverId, senderModel, receiverModel, message) are required.",
      });
    }

    // ✅ Validate senderModel and receiverModel values
    const allowedModels = ["User", "Driver"];
    if (
      !allowedModels.includes(senderModel) ||
      !allowedModels.includes(receiverModel)
    ) {
      return res.status(400).json({
        success: false,
        message: "senderModel and receiverModel must be 'User' or 'Driver'.",
      });
    }

    // ✅ Check if sender and receiver exist in DB
    const SenderModel = senderModel === "User" ? User : Driver;
    const ReceiverModel = receiverModel === "User" ? User : Driver;

    const senderExists = await SenderModel.findById(senderId);
    const receiverExists = await ReceiverModel.findById(receiverId);

    if (!senderExists || !receiverExists) {
      return res.status(404).json({
        success: false,
        message: "Sender or receiver not found.",
      });
    }

    // ✅ Create chat message
    const chat = await Chat.create({
      senderId,
      receiverId,
      senderModel,
      receiverModel,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      chat,
    });
  } catch (error) {
    console.error("Error creating chat message:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const getChatMessages = async (req, res) => {
  try {
    const { senderId, receiverId } = req.query;

    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "senderId and receiverId are required to fetch messages.",
      });
    }

    const messages = await Chat.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 }); // Oldest first

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = {
  createChatMessage,
  getChatMessages,
};
