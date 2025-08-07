const express = require("express");
const { register, login, UpdateProfile, getProfile, logout, forgetPassword, verifyOtp, resetPassword } = require("../../controllers/AdminControllers/admin.controller");
const {authToken} = require("../../middlewares/admin.middleware")
const { upload } = require("../../config/cloudinary");
const router = express.Router();

router.post("/register", upload.single("profileImage"), register)
router.post("/login", login)
router.post('/forget-password', forgetPassword)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)
router.get("/getProfile",authToken, getProfile)
router.put("/update-profile", authToken, upload.single("profileImage"), UpdateProfile)
router.post("/logout", authToken, logout)

module.exports = router
