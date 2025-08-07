const moment = require("moment");
const mongoose = require("mongoose");
const DriverReward = require("../models/DriverModels/driverReward.model");
const DriverWallet = require("../models/DriverModels/driverWallet.model");
const Ride = require("../models/UserModels/ride.model");
const { getDriverModelType } = require("./driverHelper");
 
const BONUS_RULES = {
  dailyRidesThreshold: 2,
  bonusAmount: 1500,
};
 
const PENALTY_RULES = {
  monthlyCancellationsThreshold: 4,
  penaltyAmount: 100,
};
 
// ✅ UPDATED: Helper function to create ride payment wallet entry with transaction ID
const createRidePaymentEntry = async (
  driverId,
  driverModel,
  rideId,
  pendingAmount,
  paymentMethod,
  transactionId = null, // Added transactionId parameter
  session = null
) => {
  const options = session ? { session } : {};
 
  try {
    const walletEntry = {
      driverId,
      driverModel,
      rideId,
      transactionType: "Credit",
      amount: pendingAmount,
      paymentMethod,
      status: "Completed",
      notes: `Ride payment received - Amount: ₹${pendingAmount} via ${paymentMethod}`,
      createdAt: new Date(),
    };
 
    // Add transaction ID if provided (for online payments)
    if (transactionId) {
      walletEntry.notes += ` | Transaction ID: ${transactionId}`;
      walletEntry.transactionId = transactionId
    }
 
    await DriverWallet.create([walletEntry], options);
 
    console.log(
      `Ride payment entry created: Amount=₹${pendingAmount}, Method=${paymentMethod}${
        transactionId ? `, TransactionID=${transactionId}` : ""
      }`
    );
  } catch (error) {
    console.error("Error creating ride payment entry:", error);
    throw error;
  }
};
 
// ✅ UPDATED: Bonus wallet entry creation (fixed amount field)
const createBonusWalletEntry = async (
  driverId,
  driverModel,
  bonusAmount,
  ridesCount,
  date,
  session = null
) => {
  const options = session ? { session } : {};
 
  try {
    await DriverWallet.create(
      [
        {
          driverId,
          driverModel,
          transactionType: "Bonus",
          amount: bonusAmount, // Fixed: was 0, now properly set to bonusAmount
          status: "Completed",
          notes: `Daily bonus for completing ${ridesCount} rides on ${date}`,
          createdAt: new Date(),
        },
      ],
      options
    );
 
    console.log(`Bonus wallet entry created: ₹${bonusAmount}`);
  } catch (error) {
    console.error("Error creating bonus wallet entry:", error);
    throw error;
  }
};
 
// ✅ UPDATED: Penalty wallet entry creation
const createPenaltyWalletEntry = async (
  driverId,
  driverModel,
  penaltyAmount,
  cancellationsCount,
  month,
  session = null
) => {
  const options = session ? { session } : {};
 
  try {
    await DriverWallet.create(
      [
        {
          driverId,
          driverModel,
          transactionType: "Penalty",
          amount: -penaltyAmount, // Negative amount for penalty
          status: "Completed",
          notes: `Monthly penalty for ${cancellationsCount} cancellations in ${month}`,
          createdAt: new Date(),
        },
      ],
      options
    );
 
    console.log(`Penalty wallet entry created: -₹${penaltyAmount}`);
  } catch (error) {
    console.error("Error creating penalty wallet entry:", error);
    throw error;
  }
};
 
// ✅ UPDATED: checkDriverAchievements function with proper wallet entry creation
const checkDriverAchievements = async (driverId, session = null) => {
  const options = session ? { session } : {};
 
  try {
    // Validate driverId
    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      throw new Error(`Invalid driverId: ${driverId}`);
    }
 
    const today = moment().startOf("day");
    const monthStart = moment().startOf("month");
 
    // Get or create reward record
    let reward = await DriverReward.findOne({ driverId }, null, options);
 
    if (!reward) {
      const driverInfo = await getDriverModelType(driverId);
      if (!driverInfo) throw new Error("Driver not found");
 
      reward = new DriverReward({
        driverId,
        driverModel: driverInfo.model,
        balance: 0,
        achievements: {
          totalRidesCompleted: 0,
          consecutiveDays: 0,
        },
      });
      await reward.save(options);
    }
 
    // UPDATE TOTAL RIDES COMPLETED
    const totalCompletedRides = await Ride.countDocuments(
      {
        assignedDriver: driverId,
        rideStatus: "Completed",
      },
      options
    );
 
    reward.achievements.totalRidesCompleted = totalCompletedRides;
 
    // Check for bonus (daily rides)
    let todayRides = await Ride.countDocuments(
      {
        assignedDriver: driverId,
        rideStatus: "Completed",
        completedAt: {
          $gte: today.toDate(),
          $lte: moment().endOf("day").toDate(),
        },
      },
      options
    );
 
    // Fallback to updatedAt if completedAt is missing
    if (todayRides === 0) {
      todayRides = await Ride.countDocuments(
        {
          assignedDriver: driverId,
          rideStatus: "Completed",
          updatedAt: {
            $gte: today.toDate(),
            $lte: moment().endOf("day").toDate(),
          },
        },
        options
      );
    }
 
    console.log(
      `Driver ${driverId}: Today's rides = ${todayRides}, Total rides = ${totalCompletedRides}`
    );
 
    // Award bonus if threshold met
    if (todayRides >= BONUS_RULES.dailyRidesThreshold) {
      const shouldAwardBonus =
        !reward.lastBonusGiven ||
        moment(reward.lastBonusGiven).isBefore(today, "day");
 
      if (shouldAwardBonus) {
        console.log(
          `Awarding bonus to driver ${driverId} for ${todayRides} rides today`
        );
 
        // Add bonus to reward balance
        reward.balance += BONUS_RULES.bonusAmount;
        reward.lastBonusGiven = new Date();
 
        // Save reward first
        await reward.save(options);
 
        // Create bonus wallet entry with proper amount
        await createBonusWalletEntry(
          driverId,
          reward.driverModel,
          BONUS_RULES.bonusAmount,
          todayRides,
          today.format("YYYY-MM-DD"),
          session
        );
 
        console.log(
          `Bonus awarded: ${BONUS_RULES.bonusAmount} added to reward balance`
        );
      }
    }
 
    // Check for penalty (monthly cancellations)
    const monthCancellations = await Ride.countDocuments(
      {
        assignedDriver: driverId,
        rideStatus: "Cancelled",
        createdAt: {
          $gte: monthStart.toDate(),
          $lte: moment().endOf("month").toDate(),
        },
      },
      options
    );
 
    if (monthCancellations >= PENALTY_RULES.monthlyCancellationsThreshold) {
      const shouldApplyPenalty =
        !reward.lastPenaltyApplied ||
        moment(reward.lastPenaltyApplied).isBefore(monthStart, "month");
 
      if (shouldApplyPenalty) {
        console.log(
          `Applying penalty to driver ${driverId} for ${monthCancellations} cancellations this month`
        );
 
        // Deduct penalty from reward balance
        reward.balance = Math.max(
          0,
          reward.balance - PENALTY_RULES.penaltyAmount
        );
        reward.lastPenaltyApplied = new Date();
 
        // Save reward first
        await reward.save(options);
 
        // Create penalty wallet entry
        await createPenaltyWalletEntry(
          driverId,
          reward.driverModel,
          PENALTY_RULES.penaltyAmount,
          monthCancellations,
          monthStart.format("MMMM YYYY"),
          session
        );
 
        console.log(
          `Penalty applied: ${PENALTY_RULES.penaltyAmount} deducted from reward balance`
        );
      }
    }
 
    // Final save to ensure all changes are persisted
    await reward.save(options);
 
    console.log(`Final reward state for driver ${driverId}:`, {
      rewardBalance: reward.balance,
      totalRidesCompleted: reward.achievements.totalRidesCompleted,
      lastBonusGiven: reward.lastBonusGiven,
    });
 
    return reward;
  } catch (error) {
    console.error("Error in checkDriverAchievements:", error);
    throw error;
  }
};
 
module.exports = {
  checkDriverAchievements,
  createRidePaymentEntry,
  createBonusWalletEntry,
  createPenaltyWalletEntry,
  BONUS_RULES,
  PENALTY_RULES,
};