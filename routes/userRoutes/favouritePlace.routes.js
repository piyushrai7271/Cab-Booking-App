const express = require("express");
const router = express.Router();

const {addFavouritePlace, getAllFavouritePlaces, getPastRides, bookRide} = require("../../controllers/UserController/FavouritePlaceController");
const { userValidateToken } = require("../../middlewares/user.middleware");

// router.post("/addFavouritePlace/:savedPlaceId", userValidateToken, addFavouritePlace);
router.get("/getAllFavouritePlaces", userValidateToken, getAllFavouritePlaces);
// router.get("/getFavouritePlaceById/:id", userValidateToken, getFavouritePlaceById);
router.get("/getPastRides", userValidateToken, getPastRides);
router.post("/bookRide/:id", userValidateToken, bookRide);

module.exports = router;
