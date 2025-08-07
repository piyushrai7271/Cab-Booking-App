const express = require("express");
const router = express.Router();
const { getPickupRideDetails } = require("../../controllers/UserController/userRideDetails.controller");
const { userValidateToken } = require("../../middlewares/user.middleware");

router.get("/pickup-details/:rideId", userValidateToken, getPickupRideDetails);
module.exports = router;
