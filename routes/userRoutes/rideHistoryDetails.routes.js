const express = require("express");
const router = express.Router();
const { getUserRideHistory, getCompletedRideDetails, getCancelledRideDetails, addRatings, cancelRideBooking, getUpcomingRideById, getCancelReason, addFavouriteLocation } = require("../../controllers/UserController/rideHistoryDetails.controller");
const { userValidateToken } = require("../../middlewares/user.middleware");

//✅ Ride History Routes
router.post("/add-ratings/:rideId",userValidateToken, addRatings);
router.get("/upcoming-ride/:rideId",userValidateToken, getUpcomingRideById);
router.get("/ride-history",userValidateToken, getUserRideHistory);
router.get("/completed-ride/:rideId",userValidateToken, getCompletedRideDetails);
router.put("/cancelRide/:rideId", userValidateToken,  cancelRideBooking);
router.get("/getCancelledRide/:rideId",userValidateToken, getCancelledRideDetails);
router.get("/getAllCancelReason",userValidateToken, getCancelReason);
router.post("/addFavouriteLocation", userValidateToken, addFavouriteLocation);
module.exports = router;
