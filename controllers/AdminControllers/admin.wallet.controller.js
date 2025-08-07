const RedemptionRequest = require("../../models/DriverModels/redemptionRequest.model");
const Driver = require("../../models/AdminModels/driver.model");
const DriverAuth = require("../../models/DriverModels/driverAuth.model");
const DriverWallet = require("../../models/DriverModels/driverWallet.model");
const Ride = require("../../models/UserModels/ride.model");
const Cab = require("../../models/AdminModels/cab.model"); 
 
const getAllRedemptionRequests = async (req, res) => {
  try {
    const { search = "", fromDate, toDate, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
 
    // Build a date filter if provided
    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {};
      if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);
      if (toDate) dateFilter.createdAt.$lte = new Date(toDate);
    }
 
    // Fetch matching redemption requests with population using refPath
    const rawRequests = await RedemptionRequest.find(dateFilter)
      .sort({ createdAt: -1 })
      .populate({
        path: "driverId",
        select: "driverName fullName email licenseNumber cabNumber mobileNo",
      });
 
    // Apply search filtering (case-insensitive) on populated fields
    const filtered = rawRequests.filter((r) => {
      const name =
        (r.driverId?.fullName || r.driverId?.driverName || "").toLowerCase();
      const license = (r.driverId?.licenseNumber || "").toLowerCase();
      const cab = (r.driverId?.cabNumber || "").toLowerCase();
      const searchTerm = search.toLowerCase();
      return (
        name.includes(searchTerm) ||
        license.includes(searchTerm) ||
        cab.includes(searchTerm)
      );
    });
 
    // Paginate the filtered results
    const paginated = filtered.slice(skip, skip + Number(limit));
 
    const formatted = await Promise.all(
      paginated.map(async (r, index) => {
        let cabNumber = r.driverId?.cabNumber || "N/A";
        let licenseNumber = r.driverId?.licenseNumber || "N/A";
 
        if (cabNumber === "N/A" || licenseNumber === "N/A") {
          const cab = await Cab.findOne({
            driverName: r.driverId?.fullName || r.driverId?.driverName,
            mobile: r.driverId?.mobileNo,
          });
          if (cab) {
            if (cabNumber === "N/A") cabNumber = cab.vehicleNo;
          }
        }
 
        return {
          srNo: skip + index + 1,
          _id: r._id,
          driverName: r.driverId?.fullName || r.driverId?.driverName || "N/A",
          email: r.driverId?.email || "N/A",
          licenseNumber,
          cabNumber,
          amount: r.amount,
          status: r.redeemStatus,
          createdAt: r.createdAt,
        };
      })
    );
 
    return res.status(200).json({
      success: true,
      totalCount: filtered.length,
      currentPage: Number(page),
      totalPages: Math.ceil(filtered.length / limit),
      data: formatted,
    });
  } catch (error) {
    console.error("Error fetching redemption requests:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching redemption requests",
      error: error.message,
    });
  }
};
 
 
 
const getDriverWalletDetails = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { search = "", fromDate, toDate, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
 
    // Check driver in both collections
    const driver =
      (await Driver.findById(driverId)) ||
      (await DriverAuth.findById(driverId));
 
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }
 
    const driverModel = driver instanceof Driver ? "Driver" : "DriverAuth";
 
    // Fetch cab if needed
    const cab = await Cab.findOne({
      driverName: driver.fullName || driver.driverName,
      mobile: driver.mobileNo,
    });
 
    // Fetch all transactions
    const walletTxns = await DriverWallet.find({ driverId, driverModel });
 
    if (!walletTxns || walletTxns.length === 0) {
      return res.status(200).json({
        success: true,
        driverDetails: {
          name: driver.fullName || driver.driverName,
          email: driver.email,
          phone: driver.mobileNo,
          cabNumber: cab?.vehicleNo || "N/A",
          licenseNumber: driver.drivingLicenseNo?.trim() ? driver.drivingLicenseNo : "N/A",
          image: driver.image,
        },
        walletBalance: 0,
        totalTransactions: 0,
        currentPage: Number(page),
        totalPages: 0,
        transactions: [],
      });
    }
 
    // 🧾 Manually calculate total wallet balance
    let walletBalance = 0;
    walletTxns.forEach((txn) => {
      if (["Credit", "Bonus"].includes(txn.transactionType)) {
        walletBalance += txn.amount;
      } else if (
        ["Debit", "RedeemRequest", "RedeemPaid", "Penalty"].includes(txn.transactionType)
      ) {
        walletBalance -= txn.amount;
      }
    });
 
    // Apply search and date filtering
    let filteredTxns = walletTxns.filter((txn) => {
      const description = (txn.notes || "").toLowerCase();
      const amount = txn.amount?.toString() || "";
      const type = (txn.transactionType || "").toLowerCase();
      const searchTerm = search.toLowerCase();
      return (
        description.includes(searchTerm) ||
        type.includes(searchTerm) ||
        amount.includes(searchTerm)
      );
    });
 
    if (fromDate || toDate) {
      const gte = fromDate ? new Date(fromDate) : null;
      const lte = toDate ? new Date(toDate) : null;
 
      filteredTxns = filteredTxns.filter((txn) => {
        const createdAt = new Date(txn.createdAt);
        return (!gte || createdAt >= gte) && (!lte || createdAt <= lte);
      });
    }
 
    // Sort and paginate
    const paginated = filteredTxns
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + Number(limit));
 
    // Resolve customer names from rideId (if available)
    const formatted = await Promise.all(
      paginated.map(async (txn, index) => {
        let customerName = "N/A";
        if (txn.rideId) {
          const ride = await Ride.findById(txn.rideId).populate("user", "fullName");
          customerName = ride?.user?.fullName || "N/A";
        }
 
        return {
          srNo: skip + index + 1,
          customerName,
          amount: txn.transactionType === "Credit" || txn.transactionType === "Bonus"
            ? `+${txn.amount}`
            : `-${txn.amount}`,
          details: txn.notes || "N/A",
          date: new Date(txn.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          time: new Date(txn.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      })
    );
 
    // ✅ Final response
    return res.status(200).json({
      success: true,
      driverDetails: {
        name: driver.fullName || driver.driverName,
        email: driver.email,
        phone: driver.mobileNo,
        cabNumber: cab?.vehicleNo || "N/A",
        licenseNumber: driver.drivingLicenseNo?.trim() ? driver.drivingLicenseNo : "N/A",
        image: driver.image,
      },
      walletBalance,
      totalTransactions: filteredTxns.length,
      currentPage: Number(page),
      totalPages: Math.ceil(filteredTxns.length / limit),
      transactions: formatted,
    });
  } catch (error) {
    console.error("Error fetching driver wallet details:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching driver wallet details",
      error: error.message,
    });
  }
};
 
module.exports = {
  getAllRedemptionRequests,
  getDriverWalletDetails
};
 