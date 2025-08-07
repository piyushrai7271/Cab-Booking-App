const express = require("express");
const router = express.Router();
const { addDriver, getAllDrivers, getDriverById, updateDriverById, deleteDriverById, blockDriverByAdmin, getDriverRideHistory, getDriverRideHistoryDetails } = require("../../controllers/AdminControllers/driver.controller");
const { upload } = require("../../config/cloudinary");
const { driverAuthToken } = require("../../middlewares/driver.middleware");

//✅ Driver Routes
router.post(
    "/add-driver",
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'aadharCardImage', maxCount: 1 },
      { name: 'panCardImage', maxCount: 1 },
      { name: 'licenceCardImage', maxCount: 1 },
      { name: 'vehicleRCImage', maxCount: 1 },
      { name: 'otherDocuments', maxCount: 5 },
    ]),
    addDriver
  );
router.get("/getAllDrivers", getAllDrivers);
router.get("/getDriverById/:id", getDriverById);
router.put("/updateDriverById/:id",
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'aadharCardImage', maxCount: 1 },
      { name: 'panCardImage', maxCount: 1 },
      { name: 'licenceCardImage', maxCount: 1 },
      { name: 'vehicleRCImage', maxCount: 1 },
      { name: 'otherDocuments', maxCount: 5 },
    ]),
   updateDriverById);
router.put("/deleteDriverById/:id", deleteDriverById);
router.put("/blockDriverById/:id", blockDriverByAdmin);
router.get("/getDriverRideHistory", driverAuthToken, getDriverRideHistory);
router.get("/getRideHistoryDetails/:driverId", driverAuthToken, getDriverRideHistoryDetails);
module.exports = router;
