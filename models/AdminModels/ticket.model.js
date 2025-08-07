// models/Ticket.js

const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  issue: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdByModel: { type: String, enum: ['User', 'Driver', 'DriverAuth'], required: true },
  status: { type: String, enum: ['Ongoing', 'Solved'], default: 'Ongoing' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Ticket', ticketSchema);
