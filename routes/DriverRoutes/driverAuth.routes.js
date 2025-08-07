const express = require("express");
const router = express.Router();
const {
  signupDriver,
  loginDriver,
  verifyOtpDriver,
  getDriverProfile,
  resendDriverOtp,
  updateDriverProfile,
  logout,
  getDriverAuthDropdown,
 
} = require("../../controllers/DriverControllers/driverAuth.controller");
const { upload } = require("../../config/cloudinary");
const { driverAuthToken } = require("../../middlewares/driver.middleware");




//✅ Driver Auth Routes
router.post("/signup", signupDriver);
router.post("/login", loginDriver);
router.post("/verify-otp", verifyOtpDriver);
router.get("/getDriverProfile", driverAuthToken, getDriverProfile);

router.post("/resend-otp", resendDriverOtp);
router.put(
  "/updateDriverProfile",
  driverAuthToken,
  upload.fields([
    { name: "vehicleImage", maxCount: 1 },
    { name: "aadharCardImage", maxCount: 1 },
    { name: "licenceCardImage", maxCount: 1 },
    { name: "registrationImage", maxCount: 1 },
  ]),
  updateDriverProfile
);
router.post("/logout", driverAuthToken, logout);
router.get("/getDriverAuthDropdown", getDriverAuthDropdown);


module.exports = router;
