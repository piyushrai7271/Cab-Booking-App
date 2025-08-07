const express = require("express");
const router = express.Router();
const { addNewVehicleType, getAllVehicleType } = require("../../controllers/AdminControllers/vehicleType.controller");
const { upload } = require("../../config/cloudinary");

router.post("/addVehicleType", upload.single("image"), addNewVehicleType);
router.get("/getAllVehicleType", getAllVehicleType);


module.exports = router;