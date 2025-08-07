const express = require("express");
const router = express.Router();
const {addPlaces, getAllSavedPlaces} = require("../../controllers/UserController/savePlaces.controller");
const { userValidateToken } = require("../../middlewares/user.middleware");


//✅ Save Places Routes
router.post("/addPlaces", userValidateToken, addPlaces);
router.get("/getAllSavedPlaces",userValidateToken, getAllSavedPlaces);


module.exports = router;