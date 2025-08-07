const Message = require("../../models/ChatModel/messages.model");
const User = require("../../models/UserModels/user.model");
const Driver = require("../../models/AdminModels/driver.model");



// ✅ Send a new message (Conversation)
const sendMessage = async (req, res) => {
  try {
    const { receiverId, receiverType, content } = req.body;

    if (!receiverId || !receiverType || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const senderId = req.user?._id || req.driver?._id;
    const senderType = req.user?._id ? "User" : "Driver";
    const newMessage = await Message.create({
      senderId,
      senderType,
      receiverId,
      receiverType,
      content,
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "Message sent successfully",
        newMessage,
      });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// ✅ Get all messages between 2 users
const getConversationBetweenUserAndDriver = async (req, res) => {
  try {
    const { receiverId, receiverType } = req.query;

    if (!receiverId || !receiverType) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const senderId = req.user?._id || req.driver?._id;

    const senderType = req.user?._id ? "User" : "Driver";

    const messages = await Message.find({
      $or: [
        {
          senderId: senderId,
          senderType: senderType,
          receiverId: receiverId,
          receiverType: receiverType,
        },
        {
          senderId: receiverId,
          senderType: receiverType,
          receiverId: senderId,
          receiverType: senderType,
        },
      ],
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Conversation fetched successfully",
      messages,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversation",
    });
  }
};

// ✅ Get Chat Partners List
const getChatPartners = async (req, res) => {
  try {
    const senderId = req.user?._id || req.driver?._id;
    const senderType = req.user ? "User" : "Driver";

    if (!senderId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Find all messages involving this user/driver
    const messages = await Message.find({
      $or: [
        { senderId: senderId.toString(), senderType },
        { receiverId: senderId.toString(), receiverType: senderType },
      ],
    }).sort({ createdAt: -1 });

    // Map to unique partners
    const partnersMap = {};

    for (const msg of messages) {
      const isSender = msg.senderId === senderId.toString();
      const partnerId = isSender ? msg.receiverId : msg.senderId;
      const partnerType = isSender ? msg.receiverType : msg.senderType;
      const key = `${partnerId}_${partnerType}`;

      if (!partnersMap[key]) {
        // count unread messages from that partner
        const unreadCount = await Message.countDocuments({
          senderId: partnerId,
          senderType: partnerType,
          receiverId: senderId.toString(),
          receiverType: senderType,
          read: false,
        });

        partnersMap[key] = {
          partnerId,
          partnerType,
          lastMessage: msg,
          unreadCount,
          partnerName: "",
          partnerImage: "",
        };
      }
    }

    const partnersList = await Promise.all(
      Object.values(partnersMap).map(async (partnerData) => {
        let partnerDetails;
        let partnerName = "Unknown";
        let partnerImage = null;

        if (partnerData.partnerType === "User") {
          partnerDetails = await User.findById(partnerData.partnerId).select(
            "fullName image"
          );
          if (partnerDetails) {
            (partnerName = partnerDetails.fullName),
              (partnerImage = partnerDetails.image);
          }
        } else {
          partnerDetails = await Driver.findById(partnerData.partnerId).select(
            "driverName image"
          );
          if (partnerDetails) {
            (partnerName = partnerDetails.driverName),
              (partnerImage = partnerDetails.image);
          }
        }
        console.log("Partner Details", partnerDetails);

        return {
          ...partnerData,
          partnerName,
          partnerImage,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Chat Partners fetched successfully",
      partnersList,
    });
  } catch (error) {
    console.error("Get chat partners error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get chat partners",
    });
  }
};

// ✅ Mark Messages as Read
const markAsRead = async (req, res) => {
  try {
    // Check if request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required",
      });
    }

    // Log the incoming request for debugging
    // console.log("Request body:", req.body);

    // Get receiver info from authentication
    const receiverId = req.user?._id || req.driver?._id;
    const receiverType = req.user ? "User" : "Driver";

    // Get sender info from request body
    const { senderId, senderType } = req.body;

    // Log the extracted values
    // console.log("Receiver ID:", receiverId);
    // console.log("Receiver Type:", receiverType);
    // console.log("Sender ID:", senderId);
    // console.log("Sender Type:", senderType);

    // Validate required fields
    if (!senderId || !senderType) {
      return res.status(400).json({
        success: false,
        message: "senderId and senderType are required in request body",
      });
    }

    if (!["User", "Driver"].includes(senderType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid senderType. Must be either 'User' or 'Driver'",
      });
    }

    // Update all unread messages where authenticated person is the receiver
    const result = await Message.updateMany(
      {
        senderId: senderId.toString(),
        senderType,
        receiverId: receiverId.toString(),
        receiverType,
        read: false,
      },
      { $set: { read: true } }
    );

    // Log the result
    // console.log("Update result:", result);

    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} messages marked as read`,
      data: {
        senderId,
        senderType,
        receiverId: receiverId.toString(),
        receiverType,
        markedRead: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
    });
  }
};

module.exports = {
  sendMessage,
  getConversationBetweenUserAndDriver,
  getChatPartners,
  markAsRead,
};
