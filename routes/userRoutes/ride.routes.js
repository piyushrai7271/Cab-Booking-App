const express = require("express");
const router = express.Router();
const {
  oneWayRideBooking,
  rentalOutStationRideBooking,
  // getAllRidesBooking,
  // getRideBookingById,
  getUserForOptions,
  getPickupOptions,
  getRelationshipOptions,
  getValidPackages,
  getAvailableCabsWithFare,
  confirmRideBooking,
  confirmAdvancePayment,
  getRemainingPayment,
  payRemainingPayment,
  getRideBookingById,
} = require("../../controllers/UserController/ride.controller");
const { userValidateToken } = require("../../middlewares/user.middleware");

// Rental Ride Router
router.post("/bookRide", userValidateToken, oneWayRideBooking);
router.post(
  "/bookRentalOrOutstation",
  userValidateToken,
  rentalOutStationRideBooking
);
router.get(
  "/getAvailableCabsWithFare",
  userValidateToken,
  getAvailableCabsWithFare
);
// router.get("/getRideHistory", userValidateToken, getRideHistory);
// router.get("/getAllRideBooking", getAllRidesBooking)
router.post(
  "/confirmRideBooking/:rideId",
  userValidateToken,
  confirmRideBooking
);
router.post(
  "/confirmAdvancePayment/:rideId",
  userValidateToken,
  confirmAdvancePayment
);
// router.get("/getRideBookingById/:id", getRideBookingById);
router.get("/getAllUserOptions", getUserForOptions);
router.get("/getAllPickupOptions", getPickupOptions);
router.get("/getAllRelationshipOptions", getRelationshipOptions);
router.get("/getAllValidPackages", getValidPackages);
router.get("/getRemainingPayment/:rideId", userValidateToken, getRemainingPayment);
router.post("/payRemainingPayment/:rideId", userValidateToken, payRemainingPayment);
router.get("/getRideBookingById/:rideId", userValidateToken,  getRideBookingById);
module.exports = router;
