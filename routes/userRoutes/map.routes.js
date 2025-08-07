const express = require("express");
const router = express.Router();
const {getCoordinates, getDistanceAndTime, getAutoSuggestion} = require("../../controllers/UserController/map.controller");

router.get("/getCoordinates", getCoordinates);
router.get("/getDistanceAndTime", getDistanceAndTime);
router.get("/get-suggestion", getAutoSuggestion);

module.exports = router;
