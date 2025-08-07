// app.js
const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ✅ Import all route modules

// Admin Routes
const adminRoutes = require("./routes/AdminRoutes/admin.routes");
const settingsRoutes = require("./routes/AdminRoutes/settings.routes");
const driverRoutes = require("./routes/AdminRoutes/driver.routes");
const referEarnRoutes = require("./routes/AdminRoutes/referEarn.routes");
const cabRoutes = require("./routes/AdminRoutes/cab.routes");
const offerRoutes = require("./routes/AdminRoutes/offer.routes");
const notificationRoutes = require("./routes/AdminRoutes/adminNotification.routes");
const ticketRoutes = require("./routes/AdminRoutes/ticket.routes");
const bookingRoutes = require("./routes/AdminRoutes/bookings.routes");
const dashboardRoutes = require("./routes/AdminRoutes/dashboard.routes");
const vehicleTypeRoutes = require("./routes/AdminRoutes/vehicleType.routes");

// Driver Routes
const driverAuthRoutes = require("./routes/DriverRoutes/driverAuth.routes");
const driverNotificationRoutes = require("./routes/DriverRoutes/driverNotification.routes");
const OngoingRideDetails = require("./routes/DriverRoutes/rideDetails.routes");
const driverHistoryRoutes = require("./routes/DriverRoutes/driverHistory.routes");
const getBookingType = require("./routes/DriverRoutes/getBookingType.routes");

// User Routes
const userRoutes = require("./routes/userRoutes/user.routes");
const rideRoutes = require("./routes/userRoutes/ride.routes");
const savePlacesRoutes = require("./routes/userRoutes/savePlaces.routes");
const favouritePlaceRoutes = require("./routes/userRoutes/favouritePlace.routes");
const mapRoutes = require("./routes/userRoutes/map.routes");
const userNotificationRoutes = require("./routes/userRoutes/userNotification.routes");
const rideHistoryRoutes = require("./routes/userRoutes/rideHistoryDetails.routes");
const vehicleVariantRoutes = require("./routes/AdminRoutes/vehicleVariant.routes");
const issueDetailsRoutes = require("./routes/userRoutes/issueDetails.routes");
const issueRoutes = require("./routes/userRoutes/issue.routes");
const userRideDetailsRoutes = require("./routes/userRoutes/userRideDetails.routes");

// Chat Routes
const chatRoutes = require("./routes/userRoutes/userChat.routes");
const driverChatRoutes = require("./routes/DriverRoutes/driverChat.routes");

//✅ Admin 
app.use("/api/admin", adminRoutes);
app.use("/api", settingsRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/referEarn", referEarnRoutes);
app.use("/api/cab", cabRoutes);
app.use("/api/offer", offerRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/ticket", ticketRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/vehicleType", vehicleTypeRoutes);


// Driver
app.use("/api/driverAuth", driverAuthRoutes);
app.use("/api/driverNotification", driverNotificationRoutes);
app.use("/api/rideDetails", OngoingRideDetails);
app.use("/api", driverHistoryRoutes);
app.use("/api", getBookingType);

// User
app.use("/api/user", userRoutes);
app.use("/api/ride", rideRoutes);
app.use("/api/savePlaces", savePlacesRoutes);
app.use("/api/favouritePlace", favouritePlaceRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/userNotification", userNotificationRoutes);
app.use("/api", rideHistoryRoutes);
app.use("/api", vehicleVariantRoutes);
app.use("/api/issueDetails", issueDetailsRoutes);
app.use("/api/issue", issueRoutes);
app.use("/api/rideDetails", userRideDetailsRoutes);

// Chat
app.use("/api/userChat", chatRoutes);
app.use("/api/driverChat", driverChatRoutes);

module.exports = app;
