const express = require("express");
const { getOngoingRideDetails } = require("../../controllers/DriverControllers/rideDetails.controller");
const router = express.Router();




//✅ Driver Auth Routes
router.get("/:rideId", getOngoingRideDetails);


module.exports = router;
