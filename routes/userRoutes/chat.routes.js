const express = require("express");
const router = express.Router();
const {
  createChatMessage,
  getChatMessages,
} = require("../../controllers/UserController/chat.controller");

router.post("/createChatMessage", createChatMessage);
router.get("/getChatMessages", getChatMessages);

module.exports = router;
