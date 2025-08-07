const userModel = require("../../models/UserModels/user.model");
const userNotificationModel = require("../../models/UserModels/userNotification.model");
const driverNotificationModel = require("../../models/DriverModels/driverNotification.model");
const driverModel = require("../../models/DriverModels/driverAuth.model");
const adminNotificationModel = require("../../models/AdminModels/adminNotification.model");



//✅ Get Users Type Dropdown
const getUsersTypeDropdown = (req, res) => {
  try {
    const usersType = ["All", "User", "Driver"];
    res.status(200).json({ success: true, usersType });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Optimization: mapping user type to model, idKey, and notification model
const userTypeMap = {
  User: {
    model: userModel,
    key: "userId",
    notificationModel: userNotificationModel,
  },
  Driver: {
    model: driverModel,
    key: "driverId",
    notificationModel: driverNotificationModel,
  },
  All: {
    models: [
      { model: userModel, notificationModel: userNotificationModel, key: 'userId' },
      { model: driverModel, notificationModel: driverNotificationModel, key: 'driverId' },
    ]
  }

};

//✅ Add Notification
const addNotification = async (req, res) => {
  try {
    const { notificationTitle, notificationMessage, usersType } = req.body;
    const image = req.file?.path;

    // Input validation
    if (!notificationTitle || !notificationMessage || !usersType) {
      return res.status(400).json({
        success: false,
        message: "notificationTitle, notificationMessage & usersType are required.",
      });
    }

    if (usersType === 'All') {
      // Handle sending to both users and drivers
      const [users, drivers] = await Promise.all([
        userModel.find().select("_id"),
        driverModel.find().select("_id")
      ]);

      const userNotifications = users.map((user) => ({
        userId: user._id,
        title: notificationTitle,
        message: notificationMessage,
        image: image || null,
      }));

      const driverNotifications = drivers.map((driver) => ({
        driverId: driver._id,
        title: notificationTitle,
        message: notificationMessage,
        image: image || null,
      }));

      await Promise.all([
        userNotificationModel.insertMany(userNotifications),
        driverNotificationModel.insertMany(driverNotifications)
      ]);
    } else {
      // Handle single user type (user or driver)
      const userTypeData = userTypeMap[usersType];

      if (!userTypeData) {
        return res.status(400).json({
          success: false,
          message: "Invalid user type provided. Use 'user', 'driver', or 'all'.",
        });
      }

      const users = await userTypeData.model.find().select("_id");

      const notifications = users.map((user) => ({
        [userTypeData.key]: user._id,
        title: notificationTitle,
        message: notificationMessage,
        image: image || null,
      }));

      await userTypeData.notificationModel.insertMany(notifications);
    }

    res.status(200).json({
      success: true,
      message: `Notification sent successfully!`,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//create Notification
const createNotification = async (req, res) => {
  try {
    const { title, message } = req.body;

    // Validate request data
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required." });
    }

    // Create notification document
    const notification = new adminNotificationModel({
      title,
      message,
    });

    // Save notification to the database
    await notification.save();
    return res.status(201).json({ success: true, message: "Notification created successfully." });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


//✅ Get Admin Read Notifications
const getAdminReadNotification = async(req, res)=>{
  try {
    const notifications = await adminNotificationModel.find({
      isRead: true
    }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, message: error.message });
  }
};

//✅ Get Admin Unread Notifications
const getAdminUnreadNotification = async(req, res)=>{
  try {
    const notifications = await adminNotificationModel.find({
      isRead: false
    }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, message: error.message });
  }
};

//✅ Update Admin Status of Unread Notification
const updateAdminStatusOfUnreadNotification = async (req, res) => {
  try {
      const { id } = req.params;
      const result = await adminNotificationModel.updateOne(
          { _id: id },
          { $set: { isRead: true } }
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






module.exports = {
  getUsersTypeDropdown,
  addNotification,
  createNotification,
  getAdminReadNotification,
  getAdminUnreadNotification,
  updateAdminStatusOfUnreadNotification
};
