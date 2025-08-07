const Booking = require("../../models/AdminModels/bookings.model");
const RentalRide = require("../../models/UserModels/ride.model");
const Cab = require("../../models/AdminModels/cab.model");
const Driver = require("../../models/AdminModels/driver.model");
const DriverAuth = require("../../models/DriverModels/driverAuth.model");



//✅ Get Booking Type
const getBookingsByType = async (req, res) => {
  try {
    const { type } = req.query;
    const driverId = req.auth?.id;

    if (!type || !["Online", "Advance"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid type: Online or Advance",
      });
    }

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: "Driver ID is required",
      });
    }

    // ✅ Identify driver and driver name
    const driverAuth = await DriverAuth.findById(driverId);
    let driverName = null;

    if (driverAuth) {
      driverName = driverAuth.fullName;
    } else {
      const driver = await Driver.findById(driverId);
      driverName = driver?.driverName;
    }

    if (!driverName) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // ✅ Get vehicle types of the driver
    const matchingCabs = await Cab.find({
      driverName,
      isDeleted: false,
    });

    const driverVehicleTypes = matchingCabs.map((cab) => cab.vehicleType);

    // ✅ Fetch both types of bookings in parallel
    const [bookings, allRides] = await Promise.all([
      type === "Advance"
        ? Booking.find({
            bookingType: "Advance Booking",
            $or: [
              // Unassigned bookings that are in process and not denied by this driver
              {
                bookingStatus: "In Process",
                $or: [
                  { assignedDriver: { $exists: false } },
                  { assignedDriver: null },
                ],
                deniedByDrivers: { $ne: driverId },
              },
              // Bookings assigned to this specific driver (regardless of status)
              {
                assignedDriver: driverId,
              },
            ],
            isDeleted: false,
          })
            .sort({ createdAt: -1 })
            .lean()
        : Promise.resolve([]),

      type === "Online"
        ? RentalRide.find({
            bookingType: "Online Booking",
            $or: [
              // Unassigned rides that are ongoing and not denied by this driver
              {
                rideStatus: "Ongoing",
                $or: [
                  { assignedDriver: { $exists: false } },
                  { assignedDriver: null },
                ],
                deniedByDrivers: { $ne: driverId },
              },
              // Rides assigned to this specific driver (regardless of status)
              {
                assignedDriver: driverId,
              },
            ],
          })
            .populate("user", "fullName mobile")
            .populate({
              path: "cabDetails",
              select: "vehicleType driverName",
              match: { driverName: driverName },
            })
            .sort({ createdAt: -1 })
            .lean()
        : Promise.resolve([]),
    ]);

    // ✅ Helper functions
    const formatDate = (date) =>
      new Date(date).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

    const formatTime = (date) =>
      new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

    const isToday = (date) => {
      const today = new Date();
      const d = new Date(date);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    };

    const formatBookingDateTime = (date) => {
      if (!date) return "Not specified";
      const d = new Date(date);
      return isToday(d)
        ? `Today, ${formatTime(d)}`
        : `${formatDate(d)}, ${formatTime(d)}`;
    };

    const response = {
      onlineBookings: [],
      advanceBookings: [],
    };

    // ✅ Advance Bookings
    if (type === "Advance") {
      bookings.forEach((booking) => {
        const vehicleType = booking.typeOfTaxi;

        // Check if booking is assigned to this driver OR if it's unassigned and driver has matching vehicle type
        const isAssignedToThisDriver =
          booking.assignedDriver &&
          (booking.assignedDriver.toString() === driverId.toString() ||
            booking.assignedDriver._id?.toString() === driverId.toString());
        const isUnassignedWithMatchingVehicle =
          !booking.assignedDriver && driverVehicleTypes.includes(vehicleType);

        if (isAssignedToThisDriver || isUnassignedWithMatchingVehicle) {
          response.advanceBookings.push({
            id: booking._id,
            customerName: booking.customerName,
            distance: `${Math.floor(Math.random() * 20) + 1} KM`,
            pickupLocation: booking.pickupLocation,
            dropLocation: booking.destination,
            pickupDateTime: formatBookingDateTime(
              booking.bookingTime || booking.createdAt
            ),
            paymentMethod: booking.modeOfPayment || "Cash",
            amount: booking.totalAmount,
            status: booking.bookingStatus,
            type: "Advance Booking",
            isAssigned: isAssignedToThisDriver,
            assignedDriverId: booking.assignedDriver || "",
          });
        }
      });
    }

    // ✅ Online Bookings
    if (type === "Online") {
      for (const ride of allRides) {
        const vehicleType =
          ride.cabDetails?.vehicleType ||
          ride.fareEstimate?.selectedVehicleType;

        // Check if ride is assigned to this driver OR if it's unassigned and driver has matching vehicle type
        const isAssignedToThisDriver =
          ride.assignedDriver &&
          (ride.assignedDriver.toString() === driverId.toString() ||
            ride.assignedDriver._id?.toString() === driverId.toString());
        const isUnassignedWithMatchingVehicle =
          !ride.assignedDriver && driverVehicleTypes.includes(vehicleType);

        if (isAssignedToThisDriver || isUnassignedWithMatchingVehicle) {
          response.onlineBookings.push({
            id: ride._id,
            customerName:
              ride.userFor === "For Me"
                ? ride.user?.fullName || "Customer"
                : ride.forOthers?.fullName || "Customer",
            distance: ride.distance ? `${ride.distance}` : "0 KM",
            pickups: ride.pickups,
            pickupLocation: ride.pickupLocation,
            dropLocation: ride.dropLocation,
            pickupDateTime:
              ride.pickups === "Pickup Later"
                ? `${formatDate(ride.pickupLater?.pickupDate)}, ${
                    ride.pickupLater?.pickupTime
                  }`
                : `Today, ${formatTime(ride.createdAt)}`,
            paymentMethod: ride.paymentMethod || "Cash",
            amount: ride.fareEstimate?.pendingAmount || 0,
            status: ride.rideStatus || "Pending",
            type: "Online Booking",
            isAssigned: isAssignedToThisDriver,
            // assignedDriverId: ride.assignedDriver || null,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      requestRideBookings: response,
    });
  } catch (error) {
    console.error("Error in getBookingsByType:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//✅ Handle Driver Response
const handleDriverResponse = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action, bookingType } = req.body;
    const driverId = req.auth?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Driver ID missing",
      });
    }

    // Check if driver is blocked
    const driverAuth = await DriverAuth.findById(driverId);
    const adminDriver = await Driver.findById(driverId);

    if (
      (driverAuth && driverAuth.blockedStatus === "Blocked") ||
      (adminDriver && adminDriver.blockedStatus === "Blocked")
    ) {
      return res.status(403).json({
        success: false,
        message: "Driver has been blocked by admin and cannot accept any rides",
      });
    }

    if (!bookingId || !action || !bookingType) {
      return res.status(400).json({
        success: false,
        message: "Booking ID, action, and booking type are required",
      });
    }

    if (!["Accept", "Deny"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'accept' or 'deny'",
      });
    }

    if (!["Online", "Advance"].includes(bookingType)) {
      return res.status(400).json({
        success: false,
        message: "Booking type must be either 'Online' or 'Advance'",
      });
    }

    const Model = bookingType === "Advance" ? Booking : RentalRide;
    const booking = await Model.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (action === "Deny") {
      await Model.findByIdAndUpdate(bookingId, {
        $addToSet: { deniedByDrivers: driverId },
      });

      return res.status(200).json({
        success: true,
        message: "Ride denied successfully",
      });
    }

    // Action === 'accept'
    if (
      booking.assignedDriver &&
      booking.assignedDriver.toString() !== driverId
    ) {
      return res.status(400).json({
        success: false,
        message: "This ride is already assigned to another driver",
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    const updateData = {
      assignedDriver: driverId,
      otp,
    };

    await Model.findByIdAndUpdate(bookingId, { $set: updateData });

    return res.status(200).json({
      success: true,
      message: "Ride accepted and assigned successfully",
      otp,
    });
  } catch (error) {
    console.error("Error in handleDriverResponse:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


//✅ Get User Booking Ride By Id
const getUserBookingRideById = async (req, res) => {
  try {
    const { rideId, type } = req.query;

    if (!rideId || !type || !["Online", "Advance"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid rideId and type (Online or Advance)",
      });
    }

    const formatDate = (date) => {
      const options = { day: "numeric", month: "short", year: "numeric" };
      return new Date(date).toLocaleDateString("en-US", options);
    };

    const formatTime = (date) => {
      const options = { hour: "2-digit", minute: "2-digit", hour12: true };
      return new Date(date).toLocaleTimeString("en-US", options);
    };

    let data = null;

    if (type === "Advance") {
      const booking = await Booking.findById(rideId).lean();
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Advance booking not found",
        });
      }

      data = {
        id: booking._id,
        customerName: booking.customerName,
        image: booking.image,
        distance: `${Math.floor(Math.random() * 3) + 1} KM`, // Approx
        pickupDateTime: `${formatDate(booking.bookingTime)}, ${formatTime(
          booking.bookingTime
        )}`,
        pickupLocation: booking.pickupLocation,
        ...(booking.enterFirstStop || booking.enterAnotherStop
          ? {
              stoppage: `${booking.enterFirstStop || ""}${
                booking.enterFirstStop && booking.enterAnotherStop ? ", " : ""
              }${booking.enterAnotherStop || ""}`,
            }
          : {}),
        dropLocation: booking.destination,
        advanceAmount: booking.advanceAmount || 0,
        pendingAmount: booking.amount - (booking.advanceAmount || 0),
        totalAmount: booking.amount,
      };
    } else if (type === "Online") {
      const ride = await RentalRide.findById(rideId)
        .populate("user", "fullName image")
        .lean();

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: "Online ride not found",
        });
      }

      data = {
        id: ride._id,
        customerName:
          ride.userFor === "For Others"
            ? ride.forOthers?.fullName
            : ride.user?.fullName || "Customer",
        distance: ride.distance ? `${ride.distance} KM` : "0 KM",
        pickupDateTime:
          ride.pickups === "Pickup Later"
            ? `${formatDate(ride.pickupLater.pickupDate)}, ${
                ride.pickupLater.pickupTime
              }`
            : `Today, ${formatTime(ride.createdAt)}`,
        pickupLocation: ride.pickupLocation,
        ...(ride.enterFirstStop || ride.enterAnotherStop
          ? {
              stoppage: `${ride.enterFirstStop || ""}${
                ride.enterFirstStop && ride.enterAnotherStop ? ", " : ""
              }${ride.enterAnotherStop || ""}`,
            }
          : {}),
        dropLocation: ride.dropLocation,
        advanceAmount: ride.fareEstimate?.advanceAmount || 0,
        pendingAmount: ride.fareEstimate?.pendingAmount || 0,
        totalAmount:
          (ride.fareEstimate?.advanceAmount || 0) +
          (ride.fareEstimate?.pendingAmount || 0),
      };
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in getBookingByRideId:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


const verifyRideBookingOTP = async (req, res) => {
  try {
    const { rideId } = req.params;
    const {rideType, otp} = req.body
    const driverId = req.auth?.id;

    if (!rideId || !otp || !rideType) {
      return res.status(400).json({
        success: false,
        message: "Ride ID, OTP, and ride type are required",
      });
    }

    if (!["Online", "Advance"].includes(rideType)) {
      return res.status(400).json({
        success: false,
        message: "Ride type must be 'Online' or 'Advance'",
      });
    }

    const Model = rideType === "Online" ? RentalRide : Booking;
    const ride = await Model.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // ✅ Convert both values to string before comparison
    if (
      !ride.assignedDriver ||
      String(ride.assignedDriver) !== String(driverId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to verify OTP for this ride",
      });
    }

    // ✅ OTP match
    if (String(ride.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified. Ride started successfully.",
    });
  } catch (error) {
    console.error("Error in verifyRideBookingOTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
};

module.exports = {
  getBookingsByType,
  getUserBookingRideById,
  handleDriverResponse,
  verifyRideBookingOTP,
};

