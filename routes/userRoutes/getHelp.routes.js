const express = require("express");
const router = express.Router();
const {
  createHelpCategory,
  getAllHelpCategories,
  updateHelpCategory,
} = require("../../controllers/UserController/getHelp.controller");

//routes for getHelp section
router.post("/createHelpCategory", createHelpCategory);
router.get("/getAllHelpCategories", getAllHelpCategories);
router.put("/updateHelpCategory/:category", updateHelpCategory);

module.exports = router;
