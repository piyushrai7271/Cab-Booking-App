const driverNotificationModel = require("../../models/DriverModels/driverNotification.model");
const {
    getUnreadNotificationCount,
    fetchNotifications,
    updateNotificationStatus,
    updateAllNotificationsStatus,
} = require("../../utils/notification");

 

//✅ Driver Notification Controller
const getDriverNotificationCount = async (req, res) => {
    try {
        const count = await getUnreadNotificationCount(
            driverNotificationModel,
            req.driver,
            "driverId",
          
        );
        return res.status(200).json({ success: true, count });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
 
//✅ Driver Read Notifications Controller
const getDriverReadNotifications = async (req, res) => {
    try {
        const notifications = await fetchNotifications(
            driverNotificationModel,
            req.driver,
            true,
            "driverId",
          
        );
 
        if (notifications.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No read notifications found.",
            });
        }
        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
 
//✅ Driver Unread Notifications Controller
const getDriverUnreadNotifications = async (req, res) => {
    try {
        const notifications = await fetchNotifications(
            driverNotificationModel,
            req.driver,
            false,
            "driverId",
         
        );
 
        if (notifications.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No unread notifications found.",
            });
        }
 
        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
 
//✅ Driver Update Status of Unread Notification Controller
const updateDriverStatusOfUnreadNotification = async (req, res) => {
    try {
        const { id } = req.params;
 
        const result = await updateNotificationStatus(
            driverNotificationModel,
            id,
            req.driver,
            "driverId",
            "driverAuthId"
        );
 
        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found or already marked as read",
            });
        }
 
        res
            .status(200)
            .json({ success: true, message: "Status updated successfully!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

//✅ Update Driver All Status Of Unread Notification Controller
const updateDriverAllStatusOfUnreadNotification = async (req, res) => {
    try {
        const result = await updateAllNotificationsStatus(
            driverNotificationModel,
            req.driver,
            "driverId"
        );
 
        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "No unread notifications found",
            });
        }
 
        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read.`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
 
module.exports = {
    getDriverNotificationCount,
    getDriverReadNotifications,
    getDriverUnreadNotifications,
    updateDriverStatusOfUnreadNotification,
    updateDriverAllStatusOfUnreadNotification,
};