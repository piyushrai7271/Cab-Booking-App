 
const express = require("express");
const router = express.Router();
const {
   createUserTermsAndConditions,
    getUserTermsAndConditions,
    updateUserTermsAndConditions,
    createDriverTermsAndConditions,
    getDriverTermsAndConditions,
    updateDriverTermsAndConditions,
    createUserPrivacyPolicy,
    getUserPrivacyPolicy,
    updateUserPrivacyPolicy,
    createDriverPrivacyPolicy,
    getDriverPrivacyPolicy,
    updateDriverPrivacyPolicy,
   createDeleteAccountPolicy,
   getDeleteAccountPolicy,
   updateDeleteAccountPolicy
} = require("../../controllers/AdminControllers/settings.controller");
 
 
 
// Terms & conditions Router
 
router.post("/createUserTerms", createUserTermsAndConditions);
router.get("/getUserTerms", getUserTermsAndConditions);
router.put("/updateUserTerms", updateUserTermsAndConditions);
 
router.post("/createDriverTerms", createDriverTermsAndConditions);
router.get("/getDriverTerms", getDriverTermsAndConditions);
router.put("/updateDriverTerms", updateDriverTermsAndConditions);
 
// Privacy Policy Router
router.post("/createUserPrivacy", createUserPrivacyPolicy);
router.get("/getUserPrivacy", getUserPrivacyPolicy);
router.put("/updateUserPrivacy", updateUserPrivacyPolicy);
 
router.post("/createDriverPrivacy", createDriverPrivacyPolicy);
router.get("/getDriverPrivacy", getDriverPrivacyPolicy);
router.put("/updateDriverPrivacy", updateDriverPrivacyPolicy);
 
// Delete Account Policy Router
 
router.post("/createDeleteAccount",createDeleteAccountPolicy);
router.get("/getDeleteAccount", getDeleteAccountPolicy); 
router.put("/updateDeleteAccount",updateDeleteAccountPolicy);
 
 
module.exports = router;