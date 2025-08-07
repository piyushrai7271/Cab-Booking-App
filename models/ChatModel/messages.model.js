const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderType: { type: String, enum: ['User', 'Driver'], required: true },
  receiverId: { type: String, required: true },
  receiverType: { type: String, enum: ['User', 'Driver'], required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Messages', messageSchema);
