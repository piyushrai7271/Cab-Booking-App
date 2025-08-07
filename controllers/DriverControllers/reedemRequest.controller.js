const mongoose = require("mongoose");
const DriverReward = require("../../models/DriverModels/driverReward.model");
const DriverWallet = require("../../models/DriverModels/driverWallet.model");
const RedemptionRequest = require("../../models/DriverModels/redemptionRequest.model");
 
// ✅ Create redemption request
const createRedemptionRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
 
  try {
    const driverId = req.auth.id;
    const { amount, redemptionMethod, upiId, bankDetails } = req.body;
 
    // Validate amount
    const reward = await DriverReward.findOne({ driverId }).session(session);
    if (!reward || reward.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Insufficient reward balance",
        availableBalance: reward?.balance || 0,
      });
    }
 
    // Create redemption request
    const redemptionRequest = await RedemptionRequest.create(
      [
        {
          driverId,
          driverModel: reward.driverModel,
          amount,
          redeemStatus: "Pending",
          redemptionMethod,
          ...(redemptionMethod === "UPI"
            ? { upiDetails: { upiId } }
            : { bankDetails }),
        },
      ],
      { session }
    );
 
    // Create wallet entry
    const walletEntry = await DriverWallet.create(
      [
        {
          driverId,
          driverModel: reward.driverModel,
          transactionType: "RedeemRequest",
          amount,
          redeemStatus: "Pending",
          referenceId: redemptionRequest[0]._id,
          referenceModel: "RedemptionRequest",
          notes: `Redemption request (${redemptionMethod})`,
        },
      ],
      { session }
    );
 
    // Update redemption request with wallet transaction ID
    redemptionRequest[0].walletTransactionId = walletEntry[0]._id;
    await redemptionRequest[0].save({ session });
 
    // Deduct from reward balance
    reward.balance -= amount;
    await reward.save({ session });
 
    await session.commitTransaction();
 
    res.status(200).json({
      success: true,
      message: "Redemption request created successfully",
      data: {
        requestId: redemptionRequest[0]._id,
        amount,
        status: "Pending",
        redemptionMethod,
        createdAt: redemptionRequest[0].createdAt,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Redemption error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create redemption request",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

//✅ Get Driver Redemptions
const getDriverRedemptions = async (req, res) => {
    try {
      const redemptions = await RedemptionRequest.find({
        driverId: req.auth.id,
      }).sort({ createdAt: -1 });
   
      res.status(200).json({
        success: true,
        data: redemptions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch redemption requests",
        error: error.message,
      });
    }
  };

module.exports = {
  createRedemptionRequest,
  getDriverRedemptions,
};
