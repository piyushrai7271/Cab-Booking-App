const Ticket = require('../../models/AdminModels/ticket.model');

const getAllTickets = async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.createdByModel) filters.createdByModel = req.query.createdByModel;
    if (req.query.ticketId) filters.ticketId = req.query.ticketId;

    const tickets = await Ticket.find(filters).sort({ createdAt: -1 });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const updated = await Ticket.findOneAndUpdate({ ticketId }, { status }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Ticket not found' });

    res.status(200).json({ success: true, ticket: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllTickets,
  updateTicketStatus,
};
