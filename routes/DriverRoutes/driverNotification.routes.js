const express = require('express')
const {
    getDriverNotificationCount,
    getDriverReadNotifications,
    getDriverUnreadNotifications,
    updateDriverStatusOfUnreadNotification,
 
} = require("../../controllers/DriverControllers/driverNotification.controller");
const{driverAuthToken} = require("../../middlewares/driver.middleware")
const router = express.Router();
 
//✅ Driver Notification Routes
router.get(
    "/getNotificationCount",
    driverAuthToken,
    getDriverNotificationCount
);
router.get(
    "/getReadNotification",
    driverAuthToken,
    getDriverReadNotifications
);
router.get(
    "/getUnreadNotification",
    driverAuthToken,
    getDriverUnreadNotifications
);
router.put(
    "/updateStatus/:id",
    driverAuthToken,
    updateDriverStatusOfUnreadNotification
);

 
module.exports = router;