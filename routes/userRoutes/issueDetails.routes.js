const express = require("express");
const router = express.Router();
const { createTitleDescription, getIssueTitle, getIssuewithTitleAndDescription } = require("../../controllers/UserController/issueDetails.controller");
const { userValidateToken } = require("../../middlewares/user.middleware");

router.post("/createTitleDescription/:issueId", userValidateToken, createTitleDescription);
router.get("/getIssueTitle/:issueId", userValidateToken, getIssueTitle);
router.get("/getTitleDescription/:id", userValidateToken, getIssuewithTitleAndDescription);


module.exports = router;

