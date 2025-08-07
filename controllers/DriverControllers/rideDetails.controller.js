const RentalRide = require("../../models/UserModels/ride.model");

// Format to "09 May 2025 10 AM"
const formatDateTimeScreenshotStyle = (isoDate) => {
  const date = new Date(isoDate);
  const optionsDate = { day: "2-digit", month: "short", year: "numeric" };
  const optionsTime = { hour: "2-digit", minute: "2-digit", hour12: true };
  const datePart = date.toLocaleDateString("en-GB", optionsDate);
  const timePart = date.toLocaleTimeString("en-US", optionsTime).replace(/:\d+ /, " ");
  return `${datePart} ${timePart.trim()};`;
};

//✅ Get Ongoing Ride Details
const getOngoingRideDetails = async (req, res) => {
  try {
    const { rideId } = req.params;

    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: "Please provide either rideId or userId",
      });
    }

    const query = { _id: rideId, rideStatus: "Ongoing" };

    const ride = await RentalRide.findOne(query).populate(
      "user",
      "fullName mobileNo email image"
    );

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "No ongoing ride found",
      });
    }

    // Determine pickupDate and pickupTime
    let pickupDate, pickupTime;

    if (ride.pickups === "Pickup Later") {
      pickupDate = ride.pickupLater.pickupDate;
      pickupTime = ride.pickupLater.pickupTime;
    } else {
      const formatted = formatDateTimeScreenshotStyle(ride.createdAt); // e.g. "14 Jun 2025 11 AM;"
      const parts = formatted.replace(";", "").split(" ");
      pickupDate = `${parts[0]} ${parts[1]} ${parts[2]}`; // e.g. "14 Jun 2025"
      pickupTime = `${parts[3]} ${parts[4]}`;             // e.g. "11 AM"
    }

    // Prepare location data
    let locationDisplay = {
      pickupLocation: ride.pickupLocation,
    };

    if (ride.rideType === "One Way") {
      locationDisplay.dropLocation = ride.dropLocation;
      const stops = [ride.enterFirstStop, ride.enterAnotherStop].filter(Boolean);
      if (stops.length > 0) {
        locationDisplay.stoppage = stops;
      }
    }

    const rideDetails = {
      rideType: ride.rideType,
      pickups: ride.pickups,
      pickupDate,
      pickupTime,
      rideStatus: ride.rideStatus,
      paymentStatus: ride.paymentStatus,
      paymentMethod: ride.paymentMethod,
      distance: `${ride.distance} km`,
      userFor: ride.userFor,
      ...locationDisplay,
    };

    if (ride.userFor === "For Others" && ride.forOthers) {
      rideDetails.forOthers = ride.forOthers;
    }

    rideDetails.createdAtFormatted = formatDateTimeScreenshotStyle(ride.createdAt);

    const response = {
      rideDetails,
      fareDetails: {
        advanceAmount: ride.fareEstimate?.advanceAmount || 0,
        pendingAmount: ride.fareEstimate?.pendingAmount || 0,
        totalAmount: ride.fareEstimate?.totalAmount || 0,
      },
      userDetails: ride.user,
      cabDetails: ride.cabDetails,
    };

    return res.status(200).json({
      success: true,
      message: "Ongoing ride details retrieved successfully",
      data: response,
    });
  } catch (error) {
    console.error("Get Ongoing Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve ongoing ride details",
      error: error.message,
    });
  }
};




module.exports = { getOngoingRideDetails};
