const express = require("express");
const {
    getUsersTypeDropdown,
    addNotification,
    createNotification,
    getAdminReadNotification,
    getAdminUnreadNotification,
    updateAdminStatusOfUnreadNotification,
 
  
} = require("../../controllers/AdminControllers/adminNotification.controller");
const { upload } = require("../../config/cloudinary");
const router = express.Router();
 
//✅ Admin Notification Routes
router.get("/getUsersType", getUsersTypeDropdown);
router.post("/addNotification", upload.single("image"), addNotification);
router.post("/createNotification", createNotification);
router.get("/getReadNotification", getAdminReadNotification);
router.get("/getUnreadNotification", getAdminUnreadNotification);
router.put("/updateStatus/:id", updateAdminStatusOfUnreadNotification);
 
module.exports = router;