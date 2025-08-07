const express = require("express");
const {
  checkDriverAchievement,
  getDriverWalletReward,
  getDriverWallet,
  getDriverWalletById
} = require("../../controllers/DriverControllers/driverWallet.controller");
const { driverAuthToken } = require("../../middlewares/driver.middleware");
const { getDriverRedemptions, createRedemptionRequest } = require("../../controllers/DriverControllers/redeemRequestController");
 
const router = express.Router();
 
// Protected routes
// router.get("/getDriverWalletReward", driverAuthToken, getDriverWalletReward);
router.get("/getDriverWallet", driverAuthToken, getDriverWallet);
router.get("/getDriverWalletById/:walletId", driverAuthToken, getDriverWalletById);
 
router.get("/achievements", driverAuthToken, checkDriverAchievement);
 
 
router.post("/createRedemptionRequest", driverAuthToken, createRedemptionRequest);
router.get("/getDriverRedemptions", driverAuthToken, getDriverRedemptions);
 
 
module.exports = router;
 
 