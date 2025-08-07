const express = require("express");
const router = express.Router();
const { addVehicleVariant, getAllVehicleVariant } = require("../../controllers/AdminControllers/vehcileVariant.controller");

router.post("/addVariant", addVehicleVariant);
router.get("/getAllVariant", getAllVehicleVariant);

module.exports = router;