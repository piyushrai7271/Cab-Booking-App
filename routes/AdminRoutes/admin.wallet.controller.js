const express = require("express");
const { getAllRedemptionRequests,getDriverWalletDetails } = require("../../controllers/AdminControllers/adminWallet.controller");

 
const router = express.Router();
 
router.get("/redeem-requests", getAllRedemptionRequests);
router.get("/driver/:driverId", getDriverWalletDetails);
 
module.exports = router;