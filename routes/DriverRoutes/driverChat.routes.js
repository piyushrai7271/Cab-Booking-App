const express = require('express');
const { getConversationBetweenUserAndDriver, getChatPartners, markAsRead, sendMessage } = require('../../controllers/ChatController/messages.controller');
const { driverAuthToken } = require('../../middlewares/driver.middleware');
const router = express.Router();

// Send Message
router.post('/sendMessage', driverAuthToken, sendMessage);
// Get conversation between two parties
router.get('/getAllconversation', driverAuthToken, getConversationBetweenUserAndDriver);
// Get all chat partners
router.get('/partners', driverAuthToken, getChatPartners);
// Mark messages as read
router.put('/markAsRead', driverAuthToken, markAsRead);

module.exports = router;
