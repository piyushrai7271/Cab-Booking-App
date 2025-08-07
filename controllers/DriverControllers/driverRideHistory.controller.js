const Cab = require("../../models/AdminModels/cab.model");
const Driver = require("../../models/AdminModels/driver.model");
const DriverAuth = require("../../models/DriverModels/driverAuth.model");
const RentalRide = require("../../models/UserModels/ride.model");
const { formatDate } = require("../../utils/dateFormat");

// ✅Get driver name helper
const getDriverName = async (driverId) => {
  try {
    if (!driverId) {
      console.error("⚠️ Missing driverId in getDriverName");
      return null;
    }
 
    const driverAuth = await DriverAuth.findById(driverId).select("fullName");
    if (driverAuth) return driverAuth.fullName;
 
    const driver = await Driver.findById(driverId).select("driverName");
    if (driver) return driver.driverName;
 
    console.warn("⚠️ Driver not found in either collection:", driverId);
    return null;
  } catch (error) {
    console.error("❌ Error in getDriverName:", error);
    return null;
  }
};
 
// ✅ Main route handler
const getBookingRideHistory = async (req, res) => {
  try {
    const { status="All", from, to } = req.query;
    const driverId = req.auth?.id; 
    if (!driverId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Driver ID missing" });
    }
 
    const driverName = await getDriverName(driverId);
    if (!driverName) {
      return res
        .status(404)
        .json({ message: "Driver not found in any collection" });
    }
 
 
   const filter = {
      rideStatus: ["Completed", "Cancelled"], // Default: All
      paymentStatus: "Paid",

    };

    // Override rideStatus if specific status is given
    if (status === "Completed") {
      filter.rideStatus = "Completed";
    } else if (status === "Cancelled") {
      filter.rideStatus = "Cancelled";
    }
    // Get cabs of this driver
    const cabs = await Cab.find({ driverName });
    const cabIds = cabs.map((cab) => cab._id);
 
    if (!cabIds.length) {
      return res.status(200).json([]);
    }
 
    filter.cabDetails = { $in: cabIds };
 
    // Apply date filter
    if (from && to) {
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
      };
    }
 
    const rides = await RentalRide.find(filter)
      .sort({ createdAt: -1 })
      .populate("cabDetails", "driverName vehicleNo image");
 
    const formatted = rides.map((ride) => ({
      id: ride._id,
      dropLocation: ride.dropLocation || "Not specified",
      status: ride.rideStatus,
      date: formatDate(ride.createdAt),
      amount: ride.fareEstimate?.pendingAmount || 0,
      image: ride.cabDetails?.image,
    }));
 
    res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ Error in getBookingRideHistory:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
 
//✅ Get booking ride details by id
const getBookingRideDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = req.auth?.id;
 
    // Get driverName from either DriverAuth or Driver
    const driverName = await getDriverName(driverId);
    if (!driverName) {
      return res.status(404).json({ message: "Driver not found" });
    }
 
    // Find all cab IDs assigned to this driver
    const cabs = await Cab.find({ driverName });
    const cabIds = cabs.map((cab) => cab._id);
 
    if (cabIds.length === 0) {
      return res
        .status(403)
        .json({ message: "No cabs assigned to this driver" });
    }
 
    // Find ride for the cab(s)
    const ride = await RentalRide.findOne({
      _id: id,
      rideStatus: { $in: ["Completed", "Cancelled"] },
      cabDetails: { $in: cabIds },

    })
      .populate("user", "fullName email mobile image")
      .populate("cabDetails", "driverName vehicleNo mobile");
 
    if (!ride) {
      return res
        .status(404)
        .json({ message: "Ride not found or not authorized for this driver" });
    }
 
    // Format response
    const response = {
      customerName: ride.user?.fullName || "Customer",
      userImage: ride.user?.image,
      driverName: ride.cabDetails?.driverName || driverName,
      amount: ride.fareEstimate?.pendingAmount || 0,
      distance: `${ride.distance} km` || "0 km",
      date: formatDate(ride.createdAt),
      pickupLocation: ride.pickupLocation,
      dropLocation: ride.dropLocation || "Not specified",
      status: ride.rideStatus,
      ...(ride.rideStatus === "Completed"
        ? {
            paymentMethod: ride.paymentMethod || "Cash",
            transactionId: ride.transactionId || "Not specified",
            ...(ride.ratings && {
              rating: ride.ratings,
              review: ride.review || "No review provided",
            }),
          }
        : {
            cancelReason: ride.cancelReason || "Not specified",
            otherReason: ride.OtherReason || "",
          }),
    };
 
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getBookingRideDetailsById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
 
 
module.exports = {
  getBookingRideHistory,
  getBookingRideDetailsById,
};