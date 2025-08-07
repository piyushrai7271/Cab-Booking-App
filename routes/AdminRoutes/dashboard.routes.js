const express = require("express");
const router = express.Router();
const { getTotalCustomersCount, getTotalBookingsCount, getTotalCompletedRidesCount, getTotalCancelledBookingCount, getIncomeOverview, getBookingOverview, getYearDropdownData } = require("../../controllers/AdminControllers/dashboard.controller");

//✅ Admin Dashboard Routes
router.get("/totalCustomers", getTotalCustomersCount);
router.get("/totalBookings", getTotalBookingsCount);
router.get("/completedRides", getTotalCompletedRidesCount);
router.get("/cancelledBookings", getTotalCancelledBookingCount);
router.get("/bookingOverview", getBookingOverview);
router.get("/incomeOverview", getIncomeOverview);
router.get("/yearDropdownData", getYearDropdownData);

module.exports = router;
