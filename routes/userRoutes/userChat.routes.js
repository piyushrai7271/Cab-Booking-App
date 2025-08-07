const express = require("express");
const {
  sendMessage,
  getConversationBetweenUserAndDriver,
  getChatPartners,
  markAsRead,
} = require("../../controllers/ChatController/messages.controller");
const { userValidateToken } = require("../../middlewares/user.middleware");
const router = express.Router();

// Send Message
router.post("/sendMessage", userValidateToken, sendMessage);
// Get conversation between two parties
router.get(
  "/getAllconversation",
  userValidateToken,
  getConversationBetweenUserAndDriver
);

// Get all chat partners
router.get("/partners", userValidateToken, getChatPartners);

// Mark messages as read
router.put("/markAsRead", userValidateToken, markAsRead);

module.exports = router;
