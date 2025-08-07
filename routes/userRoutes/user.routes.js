const express = require("express");
const {
  register,
  login,
  verifyOtp,
  resendOtp,
  getProfile,
  updateProfile,
  logout,
  getAllGenders,
  getAllUser,
  getUserById,
  editUserByAdmin,
  deleteUserByAdmin,
  blockUserByAdmin,
  getAllUsersForDropdown,
} = require("../../controllers/UserController/user.controller");
const { userValidateToken } = require("../../middlewares/user.middleware");
const{ upload} = require("../../config/cloudinary");

const router = express.Router();


router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
 
router.get("/getProfile", userValidateToken, getProfile);
router.get("/getAllGenders", getAllGenders);
router.put(
    "/updateProfile",
    userValidateToken,
    upload.single("image"),
    updateProfile
);
router.post("/logout",userValidateToken, logout);

router.get("/getAllUser", getAllUser);
router.get("/getUserById/:id", getUserById);
router.put("/editUser/:id",upload.single("image"), editUserByAdmin);
router.put("/blockUser/:id", blockUserByAdmin);
router.put("/deleteUser/:id", deleteUserByAdmin);
router.get("/getAllUsersForDropdown", getAllUsersForDropdown);


module.exports = router;