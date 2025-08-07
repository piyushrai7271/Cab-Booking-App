const mongoose = require("mongoose");
 
const UserPrivacyPolicySchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
  },
  { timestamps: true }
);
 
const DriverPrivacyPolicySchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
  },
  { timestamps: true }
);
 
// User terms and conditions
const UserTermsAndConditionSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
  },
  { timestamps: true }
);
 
// Driver terms and conditions
const DriverTermsAndConditionSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
  },
  { timestamps: true }
);

  
// Delete Account Schema
 
const deleteAccountSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);
 
const UserTermsAndConditionModel =
  mongoose.models.TermsAndConditions ||
  mongoose.model("UserTermsAndConditions", UserTermsAndConditionSchema);
 
  const DriverTermsAndConditionModel =
  mongoose.models.TermsAndConditions ||
  mongoose.model("DriverTermsAndConditions", DriverTermsAndConditionSchema);
 
const UserPrivacyPolicyModel =
  mongoose.models.UserPrivacyPolicy ||
  mongoose.model("UserPrivacyPolicy", UserPrivacyPolicySchema);
 
const DriverPrivacyPolicyModel =
  mongoose.models.DriverPrivacyPolicy ||
  mongoose.model("DriverPrivacyPolicy", DriverPrivacyPolicySchema);
  
const DeleteAccountModel =
  mongoose.models.DeleteAccount ||
  mongoose.model("DeleteAccount", deleteAccountSchema);
 
module.exports = { 
  UserTermsAndConditionModel,
  DriverTermsAndConditionModel,
  DeleteAccountModel,
  UserPrivacyPolicyModel,
  DriverPrivacyPolicyModel,
}
 