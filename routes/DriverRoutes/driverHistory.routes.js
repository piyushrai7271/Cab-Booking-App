const express = require("express");
const router = express.Router();
const { getBookingRideHistory, getBookingRideDetailsById } = require("../../controllers/DriverControllers/driverRideHistory.controller");
const { driverAuthToken } = require("../../middlewares/driver.middleware");

router.get("/getBookingRideHistory",driverAuthToken, getBookingRideHistory);
router.get("/getBookingRideDetailsById/:id", driverAuthToken, getBookingRideDetailsById);

module.exports = router;