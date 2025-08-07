const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  ticketId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderType: { type: String, enum: ['User', 'Driver', 'Admin'], required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
