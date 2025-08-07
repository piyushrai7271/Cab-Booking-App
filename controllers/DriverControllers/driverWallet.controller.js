
const DriverAuth = require("../../models/DriverModels/driverAuth.model");
const Driver = require("../../models/AdminModels/driver.model");
const RentalRide = require("../../models/UserModels/ride.model");
const DriverWallet = require("../../models/DriverModels/driverWallet.model")
const DriverReward = require("../../models/DriverModels/driverReward.model")
const { formatDate } = require("../../utils/dateFormat");
const moment = require("moment");


//✅ Get Driver Wallet 
const getDriverWallet = async (req, res) => {
  try {
    const driverId = req.auth?.id;
    const { filter = "All" } = req.query;
 
    let query = { driverId };
 
    // Handle different filter cases
    if (filter === "Credit") {
      query.$or = [
        { transactionType: "Credit", paymentMethod: "Online" },
        { transactionType: "Bonus" },
      ];
    } else if (filter === "Debit") {
      query.$or = [
        { transactionType: "Penalty" },
        { transactionType: "RedeemRequest" },
      ];
    } else if (filter === "All") {
      // For "All" filter, show all transactions but only Credit with Online payment
      query.$or = [
        // All transaction types except Credit
        { transactionType: { $nin: ["Credit"] } },
        // OR Credit transactions with Online payment
        { transactionType: "Credit", paymentMethod: "Online" },
      ];
    }
    // else if (filter === "Cancel") {
    //   query.transactionType = "Penalty";
    //   query.notes = { $regex: /ride cancelation/i };
    // }
    else if (
      [
        "Credit",
        "Debit",
        "Bonus",
        "Penalty",
        "RedeemRequest",
        "RedeemPaid",
      ].includes(filter)
    ) {
      query.transactionType = filter;
    }
    // For "All", no additional filtering needed
 
    // Get wallet balance
    const reward = (await DriverReward.findOne({ driverId })) || { balance: 0 };
 
    // Get filtered transactions for display
    const transactions = await DriverWallet.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "rideId",
        select: "distance user",
        populate: {
          path: "user",
          select: "fullName image",
        },
      });
 
    // Format the response
    const formattedTransactions = transactions.map((tx) => {
      const transactionData = {
        _id: tx._id,
        transactionType: tx.transactionType,
        amount: tx.amount,
        distance: tx.rideId?.distance,
        createdAt: datFormatFunc(tx.createdAt),
        notes: tx.notes,
      };
 
      // Add user data if available through rideId
      if (tx.rideId?.userId) {
        transactionData.user = {
          fullName: tx.rideId.userId.fullName,
          image: tx.rideId.userId.image,
        };
      }
 
      return transactionData;
    });
 
    res.status(200).json({
      success: true,
      data: {
        walletBalance: reward.balance,
        transactions: formattedTransactions,
      },
    });
  } catch (error) {
    console.error("Driver Wallet Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};
 

//✅ Get Driver Wallet By ID
const getDriverWalletById = async (req, res) => {
  try {
    const driverId = req.auth?.id;
    const { walletId } = req.params;
 
    if (!walletId) {
      return res.status(400).json({
        success: false,
        message: "Wallet ID is required",
      });
    }
 
    const tx = await DriverWallet.findById(walletId).populate({
      path: "rideId",
      // ✅ Removed 'select' to include all ride fields
      populate: {
        path: "user",
        select: "fullName",
      },
    });
 
    if (!tx) {
      return res.status(404).json({
        success: false,
        message: "Wallet entry not found",
      });
    }
 
    // Format the response
    const response = {
      transactionDetail: {
        transactionId: tx?.transactionId,
        transactionAmount: tx.rideId?.fareEstimate?.pendingAmount || tx.amount,
        totalAmount: tx.rideId?.fareEstimate?.pendingAmount || tx.amount,
        date: datFormatFunc(tx.createdAt),
        ...(tx.paymentMethod && { paymentMethod: tx.paymentMethod }),
        ...(tx.notes && { notes: tx.notes }),
      },
      ...(tx.rideId && {
        rideDetail: {
          rideDate: datFormatFunc(tx.rideId?.createdAt || tx.createdAt),
          ...(tx.rideId?.pickupLocation && {
            pickupLocation: tx.rideId.pickupLocation,
          }),
          ...(tx.rideId?.dropLocation && {
            dropLocation: tx.rideId.dropLocation,
          }),
          ...(tx.rideId?.distance && { distance: tx.rideId.distance }),
          ...(tx.rideId?.duration && { duration: tx.rideId.duration }),
          ...(tx.rideId?.rideType && { rideType: tx.rideId.rideType }),
          ...((tx.rideId?.enterFirstStop || tx.rideId?.enterAnotherStop) && {
            stoppage:
              [
                ...(tx.rideId?.enterFirstStop
                  ? [tx.rideId.enterFirstStop]
                  : []),
                ...(tx.rideId?.enterAnotherStop
                  ? [tx.rideId.enterAnotherStop]
                  : []),
              ].join(", ") || "NA",
          }),
        },
      }),
      ...(tx.rideId?.user && {
        recipientDetail: {
          recipientName: tx.rideId.user.fullName,
          ...(tx.paymentMethod && { paymentMethod: tx.paymentMethod }),
        },
      }),
    };
 
    // Clean empty objects
    Object.keys(response).forEach((key) => {
      if (
        response[key] &&
        typeof response[key] === "object" &&
        Object.keys(response[key]).length === 0
      ) {
        delete response[key];
      }
    });
 
    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Driver Wallet Fetch by ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wallet entry",
      error: error.message,
    });
  }
};
 
//✅ Check Driver Achievement
const checkDriverAchievement = async (req, res) => {
  try {
    const driverId = req.auth.id; // Get driver ID from authenticated request
 
    // Manually trigger achievement check
    const result = await checkDriverAchievements(driverId);
 
    res.status(200).json({
      success: true,
      message: "Achievements checked successfully",
      data: {
        balance: result.balance,
        lastBonusGiven: result.lastBonusGiven,
        lastPenaltyApplied: result.lastPenaltyApplied,
      },
    });
  } catch (error) {
    console.error("Achievement check error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking driver achievements",
      error: error.message,
    });
  }
};



module.exports = {
  getDriverWallet,
  getDriverWalletById,
  checkDriverAchievement,
};