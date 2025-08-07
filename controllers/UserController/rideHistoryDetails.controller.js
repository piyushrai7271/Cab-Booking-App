const Ride = require("../../models/UserModels/ride.model");
const Cab = require("../../models/AdminModels/cab.model");
const { getFare } = require("../../services/map.services");
const FavoritePlace = require("../../models/UserModels/favouritePlace.model");


//✅ Add ratings
const addRatings = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { rating } = req.body;

    if (!rideId || !rating) {
      return res.status(400).json({ success: false, message: "Invalid rideId or rating" });
    }

    const ratings = await Ride.findById(rideId).select("ratings");
    if (!ratings) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }
    if (ratings.ratings) {
      return res.status(400).json({ success: false, message: "Ride already rated" });
    }

    ratings.ratings = rating;
    await ratings.save();

    return res.status(200).json({
      success: true,
      message: "Ride rated successfully",
      ratings
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Failed to add ratings" });
  }
}

//✅ Get Upcoming Ride Details
const getUpcomingRideById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rideId } = req.params;

    if (!rideId) {
      return res.status(400).json({ message: "Ride ID is required." });
    }

    const ride = await Ride.findOne({
      _id: rideId,
      user: userId,
      rideStatus: { $in: ["Pending", "Ongoing"] },
    }).populate("cabDetails", "image");

    if (!ride) {
      return res.status(404).json({ message: "Ride not found." });
    }

    // Format date & time
    const dateObj = ride.pickupLater?.pickupDate
      ? new Date(`${ride.pickupLater.pickupDate} ${ride.pickupLater.pickupTime || "00:00"}`)
      : new Date(ride.createdAt);

    const formattedDate = dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });

    const formattedTime = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Extract vehicleType and price from fareEstimate (corrected logic)
    let vehicleType = "N/A";
    let price = 0;

    if (ride.fareEstimate && typeof ride.fareEstimate === "object") {
      const vehicleTypes = Object.keys(ride.fareEstimate);
      if (vehicleTypes.length > 0) {
        vehicleType = vehicleTypes[0]; // e.g., "Sedan"
        const fareInfo = ride.fareEstimate[vehicleType]?.[0];
        if (fareInfo && fareInfo.price) {
          const numericPrice = parseInt(fareInfo.price.replace(/[^\d]/g, ""), 10);
          price = isNaN(numericPrice) ? 0 : numericPrice;
        }
      }
    }

    const cabImage = ride.cabDetails?.image || null;

    const upcomingRideDetails = {
      date: `${formattedDate} .${formattedTime}`,
      pickupLocation: ride.pickupLocation,
      dropLocation: ride.dropLocation || "No drop location",
      highPrice: `${price} Rs`,
      vehicleType,
      cabImage,
    };

    return res.status(200).json({ ride: upcomingRideDetails });

  } catch (error) {
    console.error("Error in getUpcomingRideById:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


//✅ Get Completed Ride Details
const getCompletedRideDetails = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { rideId } = req.params;

    if (!rideId) {
      return res.status(400).json({ message: "Ride ID is required." });
    }

    const ride = await Ride.findOne({
      _id: rideId,
      user: userId,
      rideStatus: "Completed",
      paymentStatus: "Paid"
    })
      .select("pickupLocation dropLocation pickupLater paymentMethod fareEstimate rideStatus ratings createdAt cabDetails")
      .populate("cabDetails", "vehicleType image");

    if (!ride) {
      return res.status(404).json({ message: "Completed ride not found." });
    }

    // ✅ Extract vehicleType from fareEstimate or cabDetails
    let vehicleType;
    if (ride.fareEstimate) {
      if (typeof ride.fareEstimate === "string") {
        try {
          const parsed = JSON.parse(ride.fareEstimate);
          console.log("Parsed fareEstimate:", parsed);
          vehicleType = parsed?.vehicleType;
        } catch (err) {
          console.error("Failed to parse fareEstimate JSON:", err);
        }
      } else if (typeof ride.fareEstimate === "object") {
        console.log("Object fareEstimate:", ride.fareEstimate);
        vehicleType = ride.fareEstimate?.vehicleType;
      }
    }

    // Fallback to cabDetails.vehicleType if fareEstimate is missing
    if (!vehicleType && ride.cabDetails?.vehicleType) {
      vehicleType = ride.cabDetails.vehicleType;
    }

    console.log("Extracted vehicleType:", vehicleType);

    // ✅ Get cab image from cabDetails or fallback by vehicleType
    let cabImage = ride.cabDetails?.image || "";

    if (!cabImage && vehicleType) {
      const cab = await Cab.findOne({
        vehicleType,
        isDeleted: false,
      }).select("image");

      cabImage = cab?.image || "";
    }

    // ✅ Format date/time
    let dateObj;
    if (ride.pickupLater?.pickupDate) {
      const dateString = `${ride.pickupLater.pickupDate} ${ride.pickupLater.pickupTime || "00:00"}`;
      dateObj = new Date(dateString);
    } else {
      dateObj = new Date(ride.createdAt);
    }

    const datePart = dateObj.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
    });
    const timePart = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // ✅ Final response
    const rideDetails = {
      rideId: ride._id,
      dateTime: `${datePart}  ${timePart}`,
      pickupLocation: ride.pickupLocation,
      dropLocation: ride.dropLocation,
      paymentMethod: ride.paymentMethod,
      rating: ride.ratings || "",
      vehicleType,
      cabImage,
    };

    return res.status(200).json({
      success: true,
      message: "Completed ride details fetched successfully",
      ride: rideDetails
    });
  } catch (error) {
    console.error("Error in getCompletedRideDetails:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch completed ride details" });
  }
};

//✅ Get User Ride History
const getUserRideHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    let { fromDate, toDate } = req.query;

    const parseDate = (str) => {
      const [day, month, year] = str.split("/");
      return new Date(`${year}-${month}-${day}`);
    };

    let query = { user: userId };

    if (fromDate && toDate) {
      try {
        const from = parseDate(fromDate);
        const to = parseDate(toDate);
        to.setHours(23, 59, 59, 999);

        if (from > to) {
          return res.status(400).json({ message: "fromDate must not be after toDate." });
        }

        query.createdAt = { $gte: from, $lte: to };
      } catch (err) {
        return res.status(400).json({ message: "Invalid date format. Use DD/MM/YYYY." });
      }
    }

    const rides = await Ride.find(query)
      .sort({ createdAt: -1 })
      .select("_id rideType rideStatus dropLocation pickupLocation selectedPackage pickupLater fareEstimate createdAt cabDetails distance duration")
      .populate("cabDetails", "vehicleType image priceOptions");

    const getCabImage = async (ride) => {
      if (ride.cabDetails?.image) return ride.cabDetails.image;

      let vehicleType;
      if (ride.fareEstimate) {
        if (typeof ride.fareEstimate === "string") {
          try {
            const parsed = JSON.parse(ride.fareEstimate);
            vehicleType = parsed.vehicleType;
          } catch (err) {
            console.error("Failed to parse fareEstimate JSON:", err);
          }
        } else {
          vehicleType = ride.fareEstimate.vehicleType;
        }
      }

      if (vehicleType) {
        const cab = await Cab.findOne({ vehicleType, isDeleted: false }).select("image");
        return cab?.image || "";
      }

      return "";
    };

    const formatRide = async (ride) => {
      const createdAt = new Date(ride.createdAt);
      const date = ride.pickupLater?.pickupDate || createdAt.toLocaleDateString("en-GB");
      const time = ride.pickupLater?.pickupTime || createdAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const cabImage = await getCabImage(ride);

      // Convert distance and duration
      let distanceInMeters = 0;
      if (typeof ride.distance === "string") {
        const match = ride.distance.match(/(\d+(\.\d+)?)/);
        if (match) distanceInMeters = parseFloat(match[1]) * 1000;
      } else if (typeof ride.distance === "number") {
        distanceInMeters = ride.distance * 1000;
      }

      let durationInSeconds = 0;
      if (typeof ride.duration === "string") {
        const match = ride.duration.match(/(\d+(\.\d+)?)/);
        if (match) {
          const value = parseFloat(match[1]);
          durationInSeconds = /min/i.test(ride.duration) ? value * 60 : value * 3600;
        }
      } else if (typeof ride.duration === "number") {
        durationInSeconds = ride.duration * 3600;
      }

      // Get fare
      let fare = null;
      try {
        const cab = ride.cabDetails;
        if (cab?.priceOptions) {
          const priceOption = Array.isArray(cab.priceOptions)
            ? cab.priceOptions[0]
            : cab.priceOptions;
          const calculatedFare = getFare(distanceInMeters, durationInSeconds, { priceOptions: priceOption });
          fare = `₹${calculatedFare}/-`;
        }
      } catch (err) {
        console.error("Fare calculation error:", err.message);
      }

      // Base structure
      const formatted = {
        _id: ride._id,
        date,
        time,
        fare,
        canRate: ride.rideStatus === "Completed",
        cabImage,
      };

      // Conditional fields
      if (ride.rideType === "One Way") {
        formatted.dropLocation = ride.dropLocation || "";
      } else if (["Rental", "OutStation"].includes(ride.rideType)) {
        formatted.pickupLocation = ride.pickupLocation || "";
        formatted.selectedPackage = ride.selectedPackage || "";
      }

      return formatted;
    };

    const upcomingRides = rides.filter((r) => ["Pending", "Ongoing"].includes(r.rideStatus));
    const pastRides = rides.filter((r) => ["Completed", "Cancelled"].includes(r.rideStatus));

    const upcoming = await Promise.all(upcomingRides.map(formatRide));
    const past = await Promise.all(pastRides.map(formatRide));

    res.status(200).json({
      success: true,
      message: "Ride history fetched successfully",
      upcoming, past
    });
  } catch (error) {
    console.error("Error fetching ride history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ride history"
    });
  }
};

//✅ Cancel Ride Booking
const cancelRideBooking = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { cancelReason, OtherReason } = req.body;

    const validReasons = ["Plan Change", "High Price", "Others"];
    if (!cancelReason || !validReasons.includes(cancelReason)) {
      return res.status(400).json({
        success: false,
        message: `Cancel reason is required and must be one of: ${validReasons.join(", ")}`,
      });
    }

    if (cancelReason === "Others" && !OtherReason) {
      return res.status(400).json({
        success: false,
        message: "Other reason is required",
      });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.rideStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Ride is already cancelled",
      });
    }

    // ✅ This is the part you were missing
    ride.rideStatus = "Cancelled";
    ride.cancelReason = cancelReason;
    ride.OtherReason = cancelReason === "Others" ? OtherReason : "";

    await ride.save();

    return res.status(200).json({
      success: true,
      message: "Ride cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel Ride Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel ride booking",
      error: error.message,
    });
  }
};

//✅ Get Cancelled Ride Details
const getCancelledRideDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rideId } = req.params;

    if (!rideId) {
      return res.status(400).json({ message: "Ride ID is required." });
    }

    const ride = await Ride.findOne({
      _id: rideId,
      user: userId,
      rideStatus: "Cancelled",
    })
      .select("pickupLocation dropLocation pickupLater cancelReason OtherReason rideStatus createdAt fareEstimate")
      .populate("cabDetails", "vehicleType image");
    if (!ride) {
      return res.status(404).json({ message: "Cancelled ride not found." });
    }

    // Determine date and time
    const dateObj = ride.pickupLater?.pickupDate
      ? new Date(`${ride.pickupLater.pickupDate} ${ride.pickupLater.pickupTime || "00:00"}`)
      : new Date(ride.createdAt);

    const datePart = dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    const timePart = dateObj.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Fetch cab image using vehicleType (if available)
    let cabImage = ride.cabDetails?.image || "";
    let vehicleType = ride.cabDetails?.vehicleType;
    if (!cabImage) {
      const cab = await Cab.findOne({
        vehicleType,
        isDeleted: false,
      }).select("image");

      cabImage = cab?.image || "";
    }

    const rideDetails = {
      rideId: ride._id,
      dateTime: `${datePart} · ${timePart}`,
      pickupLocation: ride.pickupLocation,
      dropLocation: ride.dropLocation || "",
      cancelReason: ride.cancelReason === "" ? ride.OtherReason : ride.cancelReason,
      vehicleType,
      cabImage,
    };

    return res.status(200).json({
      success: true,
      message: "Cancelled ride details fetched successfully",
      ride: rideDetails
    });
  } catch (error) {
    console.error("Error in getCancelledRideDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cancelled ride details"
    });
  }
}

//✅ Add Favourite Location
const addFavouriteLocation = async (req, res) => {
  try {
    const { dropLocation } = req.body;
    const userId = req.user._id;

    if (!dropLocation) {
      return res.status(400).json({ message: "Location is required." });
    }

    const alreadyExists = await FavoritePlace.findOne({
      user: userId,
      location: dropLocation,
    });

    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "This location is already marked as favourite.",
      });
    }

    const favourite = await FavoritePlace.create({
      user: userId,
      location: dropLocation,
    });

    return res.status(200).json({
      success: true,
      message: "Favourite location added successfully",
      data: favourite,
    });
  } catch (error) {
    console.error("Error in addFavouriteLocation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add favourite location",
    });
  }
};

//✅ DropDown Api For Cancel Reason
const getCancelReason = async(req, res) =>{
  try {
    const cancelReason = ["Plan Change", "High Price", "Others"];
    return res.status(200).json({
      success: true,
      message: "Cancel reason fetched successfully",
      cancelReason
    });
    
  } catch (error) {
    console.error("Error in getCancelReason:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cancel reason"
    });
  }
}




module.exports = {
  addRatings,
  getUpcomingRideById,
  getUserRideHistory,
  getCompletedRideDetails,
  getCancelledRideDetails,
  cancelRideBooking,
  getCancelReason,
  addFavouriteLocation,
};