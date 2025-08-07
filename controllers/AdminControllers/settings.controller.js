const Settings = require("../../models/AdminModels/settings.model");


//✅ Create User Terms and Conditions
const createUserTermsAndConditions = async (req, res) => {
  try {
    const { description } = req.body;

    // Check if already exists
    const existing = await Settings.UserTermsAndConditionModel.findOne();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Terms and conditions already exist. You cannot create it again.",
      });
    }

    // Create new entry
    const termsAndConditions = new Settings.UserTermsAndConditionModel({
      description,
    });

    await termsAndConditions.save();

    return res.status(201).json({
      success: true,
      message: "Terms and conditions created successfully",
      termsAndConditions:termsAndConditions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


//✅ Get User Terms and Conditions
const getUserTermsAndConditions = async (req, res) => {
  try {
    const termsAndConditions =
      await Settings.UserTermsAndConditionModel.findOne();
    if (!termsAndConditions) {
      return res.status(404).json({ error: "Terms and conditions not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Terms and conditions fetched successfully",
      termsAndConditions,
    });
  } catch (error) {}
};

//✅ Update User Terms and Conditions
const updateUserTermsAndConditions = async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ message: "Description is required" });
  }

  try {
    const updated = await Settings.UserTermsAndConditionModel.findOneAndUpdate(
      {},
      { description },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Terms and Conditions updated successfully",
      updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

//✅ Create Driver Terms and Conditions
const createDriverTermsAndConditions = async (req, res) => {
  {
    try {
      const { description } = req.body;
      const existingTermsAndConditions = await Settings.DriverTermsAndConditionModel.findOne();
      if (existingTermsAndConditions) {
        return res.status(409).json({
          success: false,
          message: "Terms and conditions already exist. You cannot create it again.",
        });
      }
      const termsAndConditions = new Settings.DriverTermsAndConditionModel({
        description,
      });
      await termsAndConditions.save();
      return res.status(201).json({
        success: true,
        message: "Terms and conditions created successfully",
        termsAndConditions:termsAndConditions,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};

//✅ Get Driver Terms and Conditions
const getDriverTermsAndConditions = async (req, res) => {
  try {
    const termsAndConditions =
      await Settings.DriverTermsAndConditionModel.findOne();
    if (!termsAndConditions) {
      return res.status(404).json({ error: "Terms and conditions not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Terms and conditions fetched successfully",
      termsAndConditions,
    });
  } catch (error) {}
};

//✅ Update Driver Terms and Conditions
const updateDriverTermsAndConditions = async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ message: "Description is required" });
  }

  try {
    const updated =
      await Settings.DriverTermsAndConditionModel.findOneAndUpdate(
        {},
        { description },
        { new: true }
      );
    return res.status(200).json({
      success: true,
      message: "Terms and Conditions updated successfully",
      updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

//✅ Create User Privacy Policy
const createUserPrivacyPolicy = async (req, res) => {
  try {
    const { description } = req.body;
    const existingPolicy = await Settings.UserPrivacyPolicyModel.findOne();
    if (existingPolicy) {
      return res.status(409).json({
        success: false,
        message: "User privacy policy already exists",
      });
    }
    const policy = new Settings.UserPrivacyPolicyModel({ description });
    await policy.save();
    return res.status(201).json({
      success: true,
      message: "User privacy policy created successfully",
      data: policy,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

//✅ Get User Privacy Policy
const getUserPrivacyPolicy = async (req, res) => {
  try {
    const policy = await Settings.UserPrivacyPolicyModel.findOne();
    if (!policy) {
      return res.status(404).json({
        success: false,
        error: "User privacy policy not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User privacy policy fetched successfully",
      data: policy,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

//✅ Update User Privacy Policy
const updateUserPrivacyPolicy = async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res
      .status(400)
      .json({ success: false, message: "Description is required" });
  }

  try {
    const updated = await Settings.UserPrivacyPolicyModel.findOneAndUpdate(
      {},
      { description },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "User privacy policy updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

//✅ Create Driver Privacy Policy
const createDriverPrivacyPolicy = async (req, res) => {
  try {
    const { description } = req.body;
    const existingPolicy = await Settings.DriverPrivacyPolicyModel.findOne();
    if (existingPolicy) {
      return res.status(409).json({
        success: false,
        message: "Driver privacy policy already exists",
      });
    }
    const policy = new Settings.DriverPrivacyPolicyModel({ description });
    await policy.save();
    return res.status(201).json({
      success: true,
      message: "Driver privacy policy created successfully",
      policy
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

//✅ Get Driver Privacy Policy
const getDriverPrivacyPolicy = async (req, res) => {
  try {
    const policy = await Settings.DriverPrivacyPolicyModel.findOne();
    if (!policy) {
      return res.status(404).json({
        success: false,
        error: "Driver privacy policy not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Driver privacy policy fetched successfully",
      data: policy,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

//✅ Update Driver Privacy Policy
const updateDriverPrivacyPolicy = async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res
      .status(400)
      .json({ success: false, message: "Description is required" });
  }

  try {
    const updated = await Settings.DriverPrivacyPolicyModel.findOneAndUpdate(
      {},
      { description },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Driver privacy policy updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

//✅ Create Delete Account Policy
const createDeleteAccountPolicy = async (req, res) => {
  try {
    const { description } = req.body;
    const existingDeleteAccountPolicy = await Settings.DeleteAccountModel.findOne();
    if (existingDeleteAccountPolicy) {
      return res.status(409).json({
        success: false,
        message: "Delete account policy already exists",
      });
    }
    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }

    const deleteAccount = await Settings.DeleteAccountModel({ description });
    await deleteAccount.save();

    return res.status(201).json({
      success: true,
      message: "Delete account policy created successfully",
      data: deleteAccount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

//✅ Get Delete Account Policy
const getDeleteAccountPolicy = async (req, res) => {
  try {
    const deleteAccount = await Settings.DeleteAccountModel.findOne();
    if (!deleteAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Delete account policy not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Delete account policy fetched successfully",
      data: deleteAccount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

//✅ Update Delete Account Policy
const updateDeleteAccountPolicy = async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ message: "Description is required" });
  }

  try {
    const updated = await Settings.DeleteAccountModel.findOneAndUpdate(
      {},
      { description },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Delete account policy not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Delete account policy updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
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
  updateDeleteAccountPolicy,
};
