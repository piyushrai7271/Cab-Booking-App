const express = require("express");
const router = express.Router()
const { createReferEarn, getReferAndEarn, updateReferEarn } = require("../../controllers/AdminControllers/referEarnController")
const {upload} = require('../../config/cloudinary')
const {authToken} = require("../../middlewares/admin.middleware")

router.post("/createReferEarn",authToken, upload.single("image"), createReferEarn)
router.get("/getReferAndEarn",authToken, getReferAndEarn)
router.put("/updateReferEarn",authToken, upload.single("image"), updateReferEarn)

module.exports = router