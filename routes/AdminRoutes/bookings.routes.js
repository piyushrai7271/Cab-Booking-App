const express = require("express");
const router = express.Router();
const {
    createBooking,
    getAllBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    getBookingTypeOptions,
    getBookingStatusOptions,
    getAllPreviousBooking,
    getPreviousBookingById,
    getParticularUserBooking
} = require("../../controllers/AdminControllers/booking.controller");


// ✅ Booking Routes
router.post("/addBookings", createBooking);
router.get("/getAllBooking", getAllBookings);
router.get("/getBooking/:id", getBookingById);
router.put("/updateBooking/:id", updateBooking);
router.put("/deleteBooking/:id", deleteBooking);
router.get("/getAllBookingTypes", getBookingTypeOptions);
router.get("/getAllBookingStatus", getBookingStatusOptions);
router.get("/getAllPreviousBooking", getAllPreviousBooking);
router.get("/getPreviousBookingById", getPreviousBookingById);
router.get("/getUserBooking", getParticularUserBooking);

module.exports = router;
