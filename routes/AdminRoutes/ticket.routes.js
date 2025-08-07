const express = require("express");
const router = express.Router();
const { getAllTickets, updateTicketStatus } = require("../../controllers/AdminControllers/ticket.controller");
const { userValidateToken } = require("../../middlewares/user.middleware");

router.get("/getAllTickets", userValidateToken, getAllTickets);
router.put("/updateTicketStatus/:ticketId", userValidateToken, updateTicketStatus);

module.exports = router;