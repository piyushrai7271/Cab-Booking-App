const express = require("express");
const router = express.Router();
const {
  addCab,
  getAllCabs,
  getCabById,
  deletCabById,
  getRateTypeOptions,
} = require("../../controllers/AdminControllers/cab.controller");
const { upload } = require("../../config/cloudinary");

router.post("/addCab", upload.single("image"), addCab);
router.get("/getAllCabs", getAllCabs);
router.get("/getCabById/:id", getCabById);
router.put("/deleteCabById/:id", deletCabById);
router.get("/getAllRateType", getRateTypeOptions);

module.exports = router;
