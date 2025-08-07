const express = require("express");
const router = express.Router();
const { getBookingsByType, handleDriverResponse, getUserBookingRideById, verifyRideBookingOTP } = require("../../controllers/DriverControllers/getBookingType.controller");
const { driverAuthToken } = require("../../middlewares/driver.middleware");

router.get("/getBookingType", driverAuthToken, getBookingsByType);
router.post("/rideResponse/:bookingId", driverAuthToken, handleDriverResponse);
router.get("/getUserBookingRideById", driverAuthToken, getUserBookingRideById);
router.post("/verifyOtp/:rideId", driverAuthToken, verifyRideBookingOTP);

module.exports = router;