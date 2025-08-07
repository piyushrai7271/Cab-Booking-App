const express = require("express");
const router = express.Router();
const { addIssue, getAllIssue } = require("../../controllers/UserController/issue.controller");

router.post("/addIssue", addIssue);
router.get("/getAllIssue", getAllIssue);

module.exports = router;