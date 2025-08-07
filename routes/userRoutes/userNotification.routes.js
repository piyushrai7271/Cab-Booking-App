const express = require("express");
const { userValidateToken } = require("../../middlewares/user.middleware");
const {
    getUserNotificationCount,
    getUserReadNotifications,
    getUserUnreadNotifications,
    updateUserStatusOfUnreadNotification,

} = require("../../controllers/UserController/userNotification.controller");
const router = express.Router();

 //✅ User Notification Routes
router.get("/getNotificationCount", userValidateToken, getUserNotificationCount);
router.get("/getReadNotification", userValidateToken, getUserReadNotifications);
router.get("/getUnreadNotification", userValidateToken, getUserUnreadNotifications);
router.put("/updateStatus/:id", userValidateToken, updateUserStatusOfUnreadNotification);

 
module.exports = router;
 