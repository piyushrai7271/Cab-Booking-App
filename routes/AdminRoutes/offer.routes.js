const express = require("express");
const router = express.Router();
const {
  createOffer,
  getAllOffers,
  updateOffer,
  deleteOffer,
  getDropDownForOffer
} = require("../../controllers/AdminControllers/offer.controller");
 
// Route for offer page
 
router.post("/createOffer", createOffer);
router.get("/getAllOffers", getAllOffers);
router.put("/updateOffer/:id", updateOffer);
router.put("/deleteOffer/:id",deleteOffer);
router.get("/getDropDownForOffer",getDropDownForOffer)
 
module.exports = router;
 