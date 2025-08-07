const Ride = require("../../models/UserModels/ride.model");
const { getFare } = require("../../services/map.services");
const { getDistanceTime } = require("../../services/map.services");
const Cab = require("../../models/AdminModels/cab.model");
const offerModel = require("../../models/AdminModels/offer.model");
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_D3D9CzhhPmwAZe",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "gTPUidHTVpnljtGjLZHUcFV4",
});
const { generateRideUniqueBookingId } = require("../../utils/bookingId");
const mongoose = require("mongoose");

// Helper function to convert seconds to duration text
function convertSecondsToDurationText(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} mins`;
  } else {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs} hr${hrs > 1 ? "s" : ""} ${mins > 0 ? mins + " mins" : ""
      }`.trim();
  }
}

//✅ OneWay Ride
const oneWayRideBooking = async (req, res) => {
  try {
    const {
      pickups,
      pickupLater,
      userFor,
      pickupLocation,
      dropLocation,
      enterFirstStop,
      enterAnotherStop,
    } = req.body;

    if (req.user.blockedStatus === "Blocked") {
      return res.status(403).json({
        success: false,
        message: "User is blocked and cannot book a ride",
      });
    }
    const validPickups = ["Pickup Now", "Pickup Later"];
    const validUserFor = ["For Me", "For Others"];

    if (!pickupLocation || !dropLocation || !pickups || !userFor) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    if (!validPickups.includes(pickups)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pickups value" });
    }

    if (!validUserFor.includes(userFor)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userFor value" });
    }

    if (pickups === "Pickup Later") {
      if (!pickupLater?.pickupDate || !pickupLater?.pickupTime) {
        return res.status(400).json({
          success: false,
          message:
            "pickupLater.pickupDate and pickupLater.pickupTime are required",
        });
      }
    }

    const dropPoints = Array.isArray(dropLocation)
      ? dropLocation
      : [dropLocation];
    if (!dropPoints.every((loc) => typeof loc === "string")) {
      return res.status(400).json({
        success: false,
        message: "dropLocation must be a string or array of strings",
      });
    }

    // Calculate total distance/duration
    let totalDistanceMeters = 0;
    let totalDurationSeconds = 0;
    const waypoints = [pickupLocation, ...dropPoints];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const { distance, duration } = await getDistanceTime(
        waypoints[i],
        waypoints[i + 1]
      );
      totalDistanceMeters += distance.value;
      totalDurationSeconds += duration.value;
    }

    const calculatedDistance = parseFloat(
      (totalDistanceMeters / 1000).toFixed(1)
    );
    const calculatedDuration =
      convertSecondsToDurationText(totalDurationSeconds);

    // Intermediate stop validation
    const validateIntermediateStop = async (stop) => {
      const fromPickup = await getDistanceTime(pickupLocation, stop);
      const toDrop = await getDistanceTime(stop, dropLocation);
      const direct = await getDistanceTime(pickupLocation, dropLocation);
      const totalWithStop = fromPickup.distance.value + toDrop.distance.value;
      const allowedMargin = 1.5;

      if (totalWithStop > direct.distance.value * allowedMargin) {
        throw new Error(
          `${stop} must be between pickupLocation and dropLocation`
        );
      }
    };

    try {
      if (enterFirstStop) await validateIntermediateStop(enterFirstStop);
      if (enterAnotherStop) await validateIntermediateStop(enterAnotherStop);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const cabs = await Cab.find({ isDeleted: false });
    if (!cabs || cabs.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No cabs available" });
    }

    const fareEstimate = {};
    const cabOptions = [];

    for (const cab of cabs) {
      const perKmOptions = (cab.priceOptions || []).filter(
        (opt) => opt.rateType === "Per KM"
      );

      if (perKmOptions.length === 0) continue;

      const priceEstimates = [];

      for (const priceOption of perKmOptions) {
        const fare = getFare(totalDistanceMeters, totalDurationSeconds, {
          ...cab.toObject(),
          priceOptions: {
            rateType: priceOption.rateType,
            price: priceOption.price,
          },
        });

        priceEstimates.push({
          rateType: priceOption.rateType,
          price: `₹${fare}/-`,
        });
      }

      fareEstimate[cab.vehicleType] = priceEstimates;

      cabOptions.push({
        _id: cab._id,
        image: cab.image,
        vehicleType: cab.vehicleType,
        priceEstimates,
        distance: `${calculatedDistance} km`,
        duration: calculatedDuration,
      });
    }

    const uniqueRideBookingId = await generateRideUniqueBookingId();

    const rideData = new Ride({
      rideBookingId: uniqueRideBookingId,
      rideType: "One Way",
      pickups,
      pickupLater: pickups === "Pickup Later" ? pickupLater : undefined,
      userFor,
      user: req.user._id,
      pickupLocation,
      dropLocation,
      ...(enterFirstStop && { enterFirstStop }),
      ...(enterAnotherStop && { enterAnotherStop }),
      fareEstimate,
      distance: calculatedDistance,
      duration: calculatedDuration,
      cabOptions,
    });

    await rideData.save();

    return res.status(201).json({
      success: true,
      message: "One way ride created successfully",
      ride: {
        _id: rideData._id,
        rideBookingId: rideData.rideBookingId,
        rideType: "One Way",
        pickups,
        userFor,
        pickupLocation,
        bookingType: rideData.bookingType,
        dropLocation,
        ...(enterFirstStop && { enterFirstStop }),
        ...(enterAnotherStop && { enterAnotherStop }),
        fareEstimate,
        rideStatus: rideData.rideStatus,
        paymentStatus: rideData.paymentStatus,
        cabOptions,
        distance: `${calculatedDistance} km`,
        duration: calculatedDuration,
        createdAt: rideData.createdAt,
      },
    });
  } catch (error) {
    console.error("One Way Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while booking ride",
      error: error.message,
    });
  }
};

//✅ Book Ride for Rental and OutStation
const rentalOutStationRideBooking = async (req, res) => {
  try {
    const {
      rideType,
      pickups,
      pickupLater,
      userFor,
      forOthers,
      pickupLocation,
      selectedPackage,
      bookingType,
    } = req.body;

    const validRideTypes = ["Rental", "OutStation"];
    const validPickups = ["Pickup Now", "Pickup Later"];
    const validUserFor = ["For Me", "For Others"];
    const validRelationships = [
      "Friend",
      "Relative",
      "Mother",
      "Father",
      "Sibling",
    ];
    const validPackages = [
      "1hr/10km",
      "1hr/20km",
      "1hr/30km",
      "1hr/40km",
      "1hr/50km",
      "1hr/60km",
    ];

    if (
      !rideType ||
      !pickupLocation ||
      !pickups ||
      !selectedPackage ||
      !userFor
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    if (!validRideTypes.includes(rideType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid rideType" });
    }

    if (!validPickups.includes(pickups)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pickups value" });
    }

    if (!validPackages.includes(selectedPackage)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid selectedPackage" });
    }

    if (!validUserFor.includes(userFor)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userFor value" });
    }

    if (userFor === "For Me" && forOthers) {
      return res.status(400).json({
        success: false,
        message: "forOthers is not required when userFor is 'For Me'",
      });
    }

    if (userFor === "For Others") {
      if (
        !forOthers?.fullName ||
        !forOthers?.relationship ||
        !forOthers?.mobileNumber
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide all details for 'For Others'",
        });
      }

      if (!validRelationships.includes(forOthers.relationship)) {
        return res.status(400).json({
          success: false,
          message: "Invalid relationship value in forOthers",
        });
      }
    }

    if (pickups === "Pickup Later") {
      if (!pickupLater?.pickupDate || !pickupLater?.pickupTime) {
        return res.status(400).json({
          success: false,
          message:
            "pickupLater.pickupDate and pickupLater.pickupTime are required",
        });
      }
    }

    // Calculate time and distance from package
    const [hourStr, kmStr] = selectedPackage.split("/");
    const hours = parseInt(hourStr.replace("hr", "").trim());
    const kms = parseInt(kmStr.replace("km", "").trim());

    const calculatedDistance = kms;
    const calculatedDuration = `${hours} hour${hours !== 1 ? "s" : ""}`;
    const distanceMeters = kms * 1000;
    const durationSeconds = hours * 3600;

    const cabs = await Cab.find({ isDeleted: false });
    if (!cabs || cabs.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No cabs available" });
    }

    const fareEstimate = {};
    const cabOptions = [];

    for (const cab of cabs) {
      const priceEstimates = [];

      if (Array.isArray(cab.priceOptions) && cab.priceOptions.length > 0) {
        for (const priceOption of cab.priceOptions) {
          let fare = 0;

          if (priceOption.rateType === "Per KM") {
            fare = kms * priceOption.price;
          } else if (priceOption.rateType === "Per Hour") {
            fare = hours * priceOption.price;
          }

          priceEstimates.push({
            rateType: priceOption.rateType,
            price: `₹${fare}/-`,
          });
        }
      }

      if (priceEstimates.length === 0) continue;

      fareEstimate[cab.vehicleType] = priceEstimates;

      cabOptions.push({
        _id: cab._id,
        image: cab.image,
        vehicleType: cab.vehicleType,
        priceEstimates,
        distance: `${calculatedDistance} km`,
        duration: calculatedDuration,
      });
    }

    const uniqueRideBookingId = await generateRideUniqueBookingId();
    const newRide = new Ride({
      rideBookingId: uniqueRideBookingId,
      rideType,
      pickups,
      pickupLater: pickups === "Pickup Later" ? pickupLater : undefined,
      userFor,
      user: req.user._id,
      forOthers: userFor === "For Others" ? forOthers : undefined,
      pickupLocation,
      selectedPackage,
      distance: `${calculatedDistance} km`,
      duration: calculatedDuration,
      fareEstimate,
      cabOptions,
      bookingType,
    });

    await newRide.save();

    return res.status(201).json({
      success: true,
      message: `${rideType} ride created successfully`,
      ride: {
        _id: newRide._id,
        rideBookingId: newRide.rideBookingId,
        rideType,
        pickups,
        userFor,
        forOthers,
        user: req.user._id,
        pickupLocation,
        bookingType: newRide.bookingType,
        selectedPackage,
        distance: `${calculatedDistance} km`,
        duration: calculatedDuration,
        fareEstimate,
        cabOptions,
        rideStatus: newRide.rideStatus,
        createdAt: newRide.createdAt,
        updatedAt: newRide.updatedAt,
      },
    });
  } catch (error) {
    console.error("Ride Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//✅ Get Available Cabs with Fare
const getAvailableCabsWithFare = async (req, res) => {
  try {
    const userId = req.user._id;

    const rides = await Ride.find({ user: userId }).select(
      "fareEstimate rideStatus distance duration"
    )
    .sort({ createdAt: -1 });

    const formattedRides = await Promise.all(
      rides.map(async (ride) => {
        // 1. Get available vehicle types from fareEstimate
        const vehicleTypes = Object.keys(ride.fareEstimate || {}).filter(
          (key) =>
            ["Sedan", "SUV", "HatchBack", "Auto", "Bike", "MPV"].includes(key)
        );

        // 2. Find all cabs matching those vehicleTypes and not deleted
        const cabs = await Cab.find({
          vehicleType: { $in: vehicleTypes },
          isDeleted: false,
        })
          .select("_id image vehicleType priceOptions")
          .lean();

        // 3. Merge fareEstimate price into each cab
        const enrichedCabs = cabs.map((cab) => {
          const cabPrice = ride.fareEstimate[cab.vehicleType] || [];
          return {
            _id: cab._id,
            vehicleType: cab.vehicleType,
            image: cab.image,
            price: cabPrice,  // Add corresponding price here
          };
        });

        // 4. Format distance
        let formattedDistance = "0 Km";
        if (ride.distance !== undefined && ride.distance !== null) {
          if (typeof ride.distance === "number") {
            formattedDistance = `${ride.distance} Km`;
          } else if (typeof ride.distance === "string") {
            const match = ride.distance.match(/(\d+(\.\d+)?)/);
            if (match) {
              formattedDistance = `${match[1]} Km`;
            }
          }
        }

        // 5. Format duration
        let formattedDuration = "0 hour";
        if (ride.duration) {
          if (typeof ride.duration === "string") {
            formattedDuration = ride.duration.trim();
            if (!/(hour|minute|hr|min)/i.test(formattedDuration)) {
              formattedDuration += " hour";
            }
          } else if (typeof ride.duration === "number") {
            formattedDuration =
              ride.duration === 1 ? "1 hour" : `${ride.duration} hours`;
          }
        }

        return {
          rideId: ride._id,
          cab: enrichedCabs,  // Now includes price field inside each cab
          distance: formattedDistance,
          duration: formattedDuration,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Available cabs with fare fetched successfully",
      rides: formattedRides,
    });
  } catch (error) {
    console.error("Get Available Cabs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available cabs Fare",
      error: error.message,
    });
  }
};


//✅ Confirm Ride Booking
const confirmRideBooking = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { vehicleType, couponCode } = req.body;

    if (!rideId) {
      return res
        .status(400)
        .json({ success: false, message: "Ride ID is required" });
    }

    const ride = await Ride.findById(rideId).populate("cabDetails");
    if (!ride) {
      return res
        .status(404)
        .json({ success: false, message: "Ride not found" });
    }

    let selectedVehicleType =
      vehicleType || (ride.cabDetails && ride.cabDetails.vehicleType);
    if (!selectedVehicleType) {
      return res.status(400).json({
        success: false,
        message: "No vehicle type selected",
      });
    }

    // ✅ Get baseFare from fareEstimate
    let baseFare = 0;
    if (
      ride.fareEstimate &&
      typeof ride.fareEstimate === "object" &&
      ride.fareEstimate[selectedVehicleType] &&
      Array.isArray(ride.fareEstimate[selectedVehicleType]) &&
      ride.fareEstimate[selectedVehicleType].length > 0 &&
      ride.fareEstimate[selectedVehicleType][0].price
    ) {
      const priceString = ride.fareEstimate[selectedVehicleType][0].price; // e.g., "₹44496/-"
      baseFare = parseInt(priceString.replace(/[^\d]/g, ""));
    }

    if (!baseFare || baseFare <= 0) {
      return res.status(400).json({
        success: false,
        message: `No valid fare found for vehicle type: ${selectedVehicleType}`,
      });
    }

    let discountPercent = 0;
    let discountAmount = 0;

    // ✅ Apply coupon if provided
    if (couponCode) {
      const couponDoc = await offerModel.findOne({
        couponCode,
        userType: "User",
        isDeleted: false,
      });

      if (!couponDoc) {
        return res.status(400).json({
          success: false,
          message: "Invalid coupon code",
        });
      }

      discountPercent = parseFloat(
        couponDoc.discountPercent || couponDoc.discountRate || 0
      );
      discountAmount = Math.round((baseFare * discountPercent) / 100);
    }

    const totalAmount = Math.round(baseFare - discountAmount);
    const advanceAmount = Math.round(totalAmount * 0.2);
    const pendingAmount = totalAmount - advanceAmount;

    // ✅ Assign cabDetails if not already set
    if (!ride.cabDetails && vehicleType) {
      const cab = await Cab.findOne({
        vehicleType,
        isDeleted: false,
      });

      if (!cab) {
        return res.status(404).json({
          success: false,
          message: `No cab found for vehicle type: ${vehicleType}`,
        });
      }

      ride.cabDetails = cab._id;
    }

    // ✅ Update ride
    ride.rideStatus = "Pending";
    ride.paymentStatus = "Unpaid";
    ride.couponCode = couponCode || undefined;

    ride.fareEstimate = {
      ...(ride.fareEstimate || {}),
      selectedVehicleType,
      baseFare,
      discountPercent,
      discountAmount,
      totalAmount,
      advanceAmount,
      pendingAmount,
    };

    await ride.save();

    const updatedRide = await Ride.findById(ride._id).populate("cabDetails");

    return res.status(200).json({
      success: true,
      message: "Ride confirmed and updated successfully",
      data: {
        rideStatus: updatedRide.rideStatus,
        paymentStatus: updatedRide.paymentStatus,
        selectedVehicleType,
        baseFare,
        discountPercent,
        discountAmount,
        totalAmount,
        advanceAmount,
        pendingAmount,
      },
    });
  } catch (error) {
    console.error("Confirm Ride Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm ride booking",
      error: error.message,
    });
  }
};



//✅ Get All Rides
const getAllRidesBooking = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      pickupSearch = "",
      dropSearch = "",
      rideType = "",
      sortOrder = "",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Build dynamic search filter
    const searchFilter = {};

    if (pickupSearch) {
      searchFilter.pickupLocation = { $regex: pickupSearch, $options: "i" };
    }

    if (dropSearch) {
      searchFilter.dropLocation = { $regex: dropSearch, $options: "i" };
    }

    if (rideType) {
      searchFilter.rideType = { $regex: rideType, $options: "i" };
    }

    const [totalRides, rides] = await Promise.all([
      Ride.countDocuments(searchFilter),
      Ride.find(searchFilter)
        .populate("user", "_id fullName image phoneNumber")
        .populate("cabDetails", "_id vehicleType tagLine image ")
        .sort(
          sortOrder === "asc"
            ? { createdAt: 1 }
            : sortOrder === "desc"
              ? { createdAt: -1 }
              : {}
        )
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(totalRides / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    res.status(200).json({
      success: true,
      message: "Rides fetched successfully",
      totalRides,
      totalPages,
      currentPage: page,
      previous: hasPrevious,
      next: hasNext,
      data: rides,
    });
  } catch (error) {
    console.error("Get All Rental Rides Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

//✅ Get Ride By Id
const getRideBookingById = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId).populate(
      "user",
      "_id fullName image phoneNumber"
    );

    if (!ride) {
      return res
        .status(404)
        .json({ success: false, message: "Ride not found" });
    }

    // Create a copy of ride object and modify fareEstimate
    const rideObj = ride.toObject();

    if (rideObj.fareEstimate && rideObj.fareEstimate.selectedVehicleType) {
      const selectedType = rideObj.fareEstimate.selectedVehicleType;
      const selectedFare = rideObj.fareEstimate[selectedType];

      // Replace fareEstimate with only the selected vehicle's fare
      rideObj.fareEstimate = {
        [selectedType]: selectedFare,
        selectedVehicleType: selectedType,
        ...(rideObj.fareEstimate.discountPercent !== undefined && {
          discountPercent: rideObj.fareEstimate.discountPercent,
          discountAmount: rideObj.fareEstimate.discountAmount,
          advanceAmount: rideObj.fareEstimate.advanceAmount,
          pendingAmount: rideObj.fareEstimate.pendingAmount,
          totalAmount: rideObj.fareEstimate.totalAmount,

          // totalAmountAfterDiscount: rideObj.fareEstimate.totalAmountAfterDiscount,
        }),
      };
    }

    return res.status(200).json({
      success: true,
      message: "Ride fetched successfully",
      ride: rideObj,
    });
  } catch (error) {
    console.error("Get Ride By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//✅ DropDown Api's for  Get User For Options
const getUserForOptions = (req, res) => {
  const options = ["For Me", "For Others"];
  res.status(200).json({ success: true, options });
};

//✅ DropDown Api's for Get Pickup Options
const getPickupOptions = (req, res) => {
  const options = ["Pickup Now", "Pickup Later"];
  res.status(200).json({ success: true, options });
};

//✅ DropDown Api's for Get Relationship Options
const getRelationshipOptions = (req, res) => {
  const options = ["Friend", "Relative", "Mother", "Father", "Sibiling"];
  res.status(200).json({ success: true, options });
};

// ✅ DropDown Api's for Get validPackages
const getValidPackages = (req, res) => {
  const options = [
    "1hr/10km",
    "1hr/20km",
    "1hr/30km",
    "1hr/40km",
    "1hr/50km",
    "1hr/60km",
  ];
  res.status(200).json({ success: true, options });
};

//✅ Confirm Advance Payment
const confirmAdvancePayment = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { paymentMethod } = req.body;

    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: "Ride ID is required",
      });
    }
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    // Validate payment method
    if (!["Cash", "Online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Must be either 'Cash' or 'Online'",
      });
    }

    // Fetch the ride with populated details
    const ride = await Ride.findById(rideId)
      .populate("cabDetails")
      .populate("user");

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Check ride status
    if (["Completed", "Cancelled"].includes(ride.rideStatus)) {
      return res.status(400).json({
        success: false,
        message: "Cannot process payment for completed or cancelled rides",
      });
    }

    // Check payment status
    if (
      ride.paymentStatus === "Advance Paid" ||
      ride.paymentStatus === "Paid"
    ) {
      return res.status(400).json({
        success: false,
        message: "Advance payment already processed for this ride",
      });
    }

    // Calculate amounts
    const totalAmount = ride.fareEstimate.advanceAmount;
    const advanceAmount = ride.fareEstimate?.advanceAmount;
    const pendingAmount = ride.fareEstimate?.pendingAmount;

    // Validate fare estimate
    if (!ride.fareEstimate?.advanceAmount) {
      return res.status(400).json({
        success: false,
        message: "Ride fare information is incomplete",
      });
    }

    // Generate OTP (4 digits)
    const otp = Math.floor(1000 + Math.random() * 9000);
    // Handle cash payment
    if (paymentMethod === "Cash") {
      ride.paymentStatus = "Advance Paid";
      ride.rideStatus = "Ongoing";
      ride.paymentMethod = paymentMethod;

      await ride.save();


      return res.status(200).json({
        success: true,
        message: "Remaining payment confirmed successfully",
        data: {
          rideId: ride._id,
          totalAmount,
          advanceAmount,
          pendingAmount,
          paymentMethod,
          rideStatus: ride.rideStatus,
          paymentStatus: ride.paymentStatus,
        },
      });
    }
    // Handle online payment
    if (paymentMethod === "Online") {
      const paymentLink = await razorpay.paymentLink.create({
        amount: advanceAmount * 100,
        currency: "INR",
        accept_partial: false,
        description: `Advance payment for ride #${ride._id
          .toString()
          .slice(-6)}`,
        customer: {
          name: ride.user.fullName || "Customer",
          contact: ride.user.phoneNumber?.toString() || "",
          email: ride.user.email || "",
        },
        notes: {
          rideId: ride._id.toString(),
          vehicleType: ride.cabDetails?.vehicleType || "Not specified",
          pickupLocation: ride.pickupLocation,
          otp: otp.toString(),
        },
        callback_url: `${process.env.BASE_URL}/api/rides/payment/verify`,
        callback_method: "get",
        options: {
          checkout: {
            name: "Ride Booking",
            description: `Advance payment for your ride (₹${advanceAmount})`,
            prefill: {
              contact: ride.user.phoneNumber?.toString() || "",
              email: ride.user.email || "",
            },
            theme: {
              color: "#3399cc",
            },
            config: {
              display: {
                blocks: {
                  banks: {
                    name: "Pay using UPI",
                    instruments: [
                      {
                        method: "upi",
                      },
                    ],
                  },
                },
                sequence: ["block.banks"],
              },
            },
          },
        },
      });

      // Only store payment details without changing statuses yet
      ride.paymentMethod = paymentMethod;
      ride.otp = otp;
      ride.paymentLinkId = paymentLink.id;
      ride.paymentLinkStatus = "created";
      await ride.save();

      return res.status(200).json({
        success: true,
        message: "Payment link created successfully",
        data: {
          paymentUrl: paymentLink.short_url,
          rideId: ride._id,
          otp,
          advanceAmount,
          pendingAmount,
          totalAmount,
          paymentMethod,
          rideStatus: ride.rideStatus, // Current status (unchanged)
          paymentStatus: ride.paymentStatus, // Current status (unchanged)
        },
      });
    }
  } catch (error) {
    console.error("Advance payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//✅ Pay remaining payment
const payRemainingPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
 
  try {
    const { rideId } = req.params;
    const { paymentMethod } = req.body;
 
    // Validate environment configuration
    if (!process.env.BASE_URL) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: "Server configuration error - BASE_URL not set",
      });
    }
 
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(rideId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid Ride ID format",
      });
    }
 
    if (!["Cash", "Online"].includes(paymentMethod)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Must be either 'Cash' or 'Online'",
      });
    }
 
    // Fetch ride with details
    const ride = await Ride.findById(rideId)
      .populate("cabDetails")
      .populate("user")
      .session(session);
 
    if (!ride) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }
 
    // Validate payment and ride status
    if (ride.paymentStatus === "Paid") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Full payment already completed for this ride",
      });
    }
 
    if (ride.paymentStatus !== "Advance Paid") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Remaining payment can only be made after advance is paid",
      });
    }
 
    // Fare validation
    const pendingAmount = ride.fareEstimate?.pendingAmount;
    const bookingFee = ride.fareEstimate?.bookingFee || 0;
    const totalAmount = ride.fareEstimate?.totalAmount || 0;
 
    if (pendingAmount === undefined || pendingAmount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid or missing pending amount in fare estimate",
      });
    }
 
    // Handle Cash Payment
    if (paymentMethod === "Cash") {
      const completionTime = new Date();
 
      ride.paymentStatus = "Paid";
      ride.rideStatus = "Completed";
      ride.paymentMethod = paymentMethod;
      ride.paymentCompletedAt = completionTime;
      ride.completedAt = completionTime;
 
      await ride.save({ session });
 
      console.log(`Ride ${rideId} completed at:`, completionTime);
 
      // Get driver info
      const driverInfo = await getDriverModelType(ride.assignedDriver);
      if (!driverInfo) {
        await session.abortTransaction();
        throw new Error("Driver not found");
      }
 
      // Create ride payment entry
      await createRidePaymentEntry(
        ride.assignedDriver,
        driverInfo.model,
        ride._id,
        pendingAmount,
        paymentMethod,
        session
      );
 
      console.log(`Checking achievements for driver: ${ride.assignedDriver}`);
      await checkDriverAchievements(ride.assignedDriver, session);
 
      await session.commitTransaction();
 
      return res.status(200).json({
        success: true,
        message: "Payment successful. Ride completed.",
        data: {
          rideId: ride._id,
          paymentStatus: ride.paymentStatus,
          rideStatus: ride.rideStatus,
          paymentCompletedAt: ride.paymentCompletedAt,
          completedAt: ride.completedAt,
          earnings: {
            pendingAmount,
          },
        },
      });
    }
 
    // Handle Online Payment
    if (paymentMethod === "Online") {
      // Check existing payment link first
      if (
        ride.paymentLinkFinalId &&
        ride.paymentLinkFinalStatus === "created"
      ) {
        try {
          const existingLink = await razorpay.paymentLink.fetch(
            ride.paymentLinkFinalId
          );
          if (existingLink.status === "created") {
            return res.status(200).json({
              success: true,
              message: "Existing payment link fetched successfully",
              data: {
                paymentUrl: existingLink.short_url,
                rideId: ride._id,
                referenceId: ride.paymentFinalReferenceId,
                pendingAmount,
                totalAmount,
                bookingFee,
                paymentMethod,
                paymentStatus: ride.paymentStatus,
                rideStatus: ride.rideStatus,
              },
            });
          }
        } catch (error) {
          console.log("Razorpay link fetch failed:", error?.message);
          // Continue to create new link if fetch fails
        }
      }
 
      // Create new payment link with retry logic
      const createPaymentLink = async () => {
        const callbackUrl = `${process.env.BASE_URL}/api/ride/remaining-payment/verify-final`;
 
        if (!callbackUrl.startsWith("http")) {
          throw new Error("Invalid callback URL configuration");
        }
 
        return await razorpay.paymentLink.create({
          reference_id: ride._id.toString(),
          amount: Math.round(pendingAmount * 100),
          currency: "INR",
          accept_partial: false,
          description: `Remaining payment for ride #${ride._id
            .toString()
            .slice(-6)}`,
          customer: {
            name: ride.user.fullName || "Customer",
            contact: ride.user.phoneNumber?.toString() || "",
            email: ride.user.email || "",
          },
          notes: {
            rideId: ride._id.toString(),
            vehicleType: ride.cabDetails?.vehicleType || "Not specified",
            pickupLocation: ride.pickupLocation,
            paymentType: "Remaining",
            bookingFee: bookingFee.toString(),
          },
          callback_url: callbackUrl,
          callback_method: "get",
          options: {
            checkout: {
              name: "Ride Booking",
              description: `Final payment for your ride (₹${pendingAmount})`,
              prefill: {
                contact: ride.user.phoneNumber?.toString() || "",
                email: ride.user.email || "",
              },
              theme: {
                color: "#3399cc",
              },
              config: {
                display: {
                  blocks: {
                    banks: {
                      name: "Pay using UPI",
                      instruments: [
                        {
                          method: "upi",
                        },
                      ],
                    },
                  },
                  sequence: ["block.banks"],
                },
              },
            },
          },
        });
      };
 
      try {
        const paymentLink = await createPaymentLink();
 
        ride.paymentLinkFinalId = paymentLink.id;
        ride.paymentLinkFinalStatus = "created";
        ride.paymentMethod = paymentMethod;
 
        await ride.save({ session });
        await session.commitTransaction();
 
        return res.status(200).json({
          success: true,
          message:
            "Online payment link for remaining amount created successfully",
          data: {
            paymentUrl: paymentLink.short_url,
            rideId: ride._id,
            totalAmount,
            bookingFee,
            pendingAmount,
            referenceId: ride._id.toString(),
            paymentMethod,
            rideStatus: ride.rideStatus,
            paymentStatus: ride.paymentStatus,
          },
        });
      } catch (razorpayError) {
        await session.abortTransaction();
        console.error("Razorpay payment link creation failed:", razorpayError);
 
        // Special handling for Razorpay API errors
        if (razorpayError.error?.code === "BAD_REQUEST_ERROR") {
          return res.status(400).json({
            success: false,
            message: "Payment gateway configuration error",
            error: razorpayError.error.description,
            details: {
              field: razorpayError.error.field || "unknown",
              code: razorpayError.error.code,
            },
          });
        }
 
        return res.status(500).json({
          success: false,
          message: "Failed to create payment link",
          error: razorpayError.message,
        });
      }
    }
  } catch (error) {
    await session.abortTransaction();
    console.error("Payment processing error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during payment processing",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

//✅ Get Remaining Payment
const getRemainingPayment = async (req, res) => {
  try {
    const { payment_link_id, payment_link_status, rideId } = req.query;

    if (!payment_link_id) {
      return res.status(400).json({
        success: false,
        message: "Payment link ID is required",
      });
    }

    // Verify payment with Razorpay
    const paymentLink = await razorpay.paymentLink.fetch(payment_link_id);

    if (paymentLink.status === "paid") {
      // Find and update the ride using either paymentLinkId or rideId
      const ride = await Ride.findOne({
        $or: [{ paymentLinkId: payment_link_id }, { _id: rideId }],
      });

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: "Ride not found",
        });
      }

      // Update ride details
      ride.paymentStatus = "Paid";
      ride.rideStatus = "Completed";
      ride.paymentLinkStatus = payment_link_status;
      ride.razorpayPaymentId = paymentLink.payments[0]?.payment_id || null;
      ride.transactionId = paymentLink.payments[0]?.transaction_id || null;

      await ride.save();

      // Prepare response data
      const responseData = {
        success: true,
        message: "Payment verified successfully",
        data: {
          rideId: ride._id,
          paymentStatus: ride.paymentStatus,
          rideStatus: ride.rideStatus,
          advanceAmount: ride.fareEstimate.advanceAmount,
          pendingAmount: ride.fareEstimate.pendingAmount,
          transactionId: ride.transactionId,
          paymentTime: new Date(),
        },
      };

      // Send response based on request type (API call or redirect)
      if (req.get("Accept")?.includes("application/json")) {
        return res.status(200).json(responseData);
      } else {
        // Store payment verification in session for frontend
        req.session.paymentVerification = responseData;
        return res.redirect(
          `${process.env.FRONTEND_URL}/payment-success?rideId=${ride._id}`
        );
      }
    } else {
      const errorMessage = `Payment not completed. Status: ${paymentLink.status}`;
      if (req.get("Accept")?.includes("application/json")) {
        return res.status(400).json({
          success: false,
          message: errorMessage,
        });
      } else {
        return res.redirect(
          `${process.env.FRONTEND_URL
          }/payment-failed?error=${encodeURIComponent(errorMessage)}`
        );
      }
    }
  } catch (error) {
    console.error("Payment verification error:", error);

    const errorResponse = {
      success: false,
      message: "Payment verification failed",
      error: error.message,
    };

    if (req.get("Accept")?.includes("application/json")) {
      return res.status(500).json(errorResponse);
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment-failed?error=${encodeURIComponent(
          errorResponse.message
        )}`
      );
    }
  }
};

//✅ Verify Remaining Payment
const verifyRemainingPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
 
  try {
    const {
      razorpay_payment_link_id,
      razorpay_payment_link_status,
      razorpay_payment_id,
    } = req.query;
 
    // Validate inputs
    if (!razorpay_payment_link_id) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Payment link ID is required" });
    }
 
    // Verify payment with Razorpay
    const paymentLink = await razorpay.paymentLink.fetch(
      razorpay_payment_link_id
    );
 
    const rideId = paymentLink.reference_id;
 
    // Now that we have rideId, we can validate it
    if (!rideId || !mongoose.Types.ObjectId.isValid(rideId)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Valid ride ID is required" });
    }
 
    if (paymentLink.status !== "paid") {
      const errorMessage = `Payment not completed. Status: ${paymentLink.status}`;
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: errorMessage,
        redirectUrl: `${
          process.env.FRONTEND_URL
        }/payment-failed?error=${encodeURIComponent(errorMessage)}`,
      });
    }
 
    // Rest of your code remains the same...
    // Get ride details within transaction
    const ride = await Ride.findById(rideId).session(session);
    if (!ride) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Ride not found" });
    }
 
    // Check if already paid (idempotency check)
    if (ride.paymentStatus === "Paid") {
      await session.abortTransaction();
      return res.status(200).json({
        success: true,
        message: "Payment was already processed",
        redirectUrl: `${process.env.FRONTEND_URL}/payment-success?rideId=${ride._id}`,
      });
    }
 
    // Update ride status
    ride.paymentStatus = "Paid";
    ride.rideStatus = "Completed";
    ride.paymentLinkFinalStatus = razorpay_payment_link_status;
    ride.razorpayFinalPaymentId =
      razorpay_payment_id || paymentLink.payments?.[0]?.payment_id || null;
    ride.paymentCompletedAt = new Date();
    ride.completedAt = new Date();
 
    await ride.save({ session });
 
    // Get driver info
    const driverInfo = await getDriverModelType(ride.assignedDriver);
    if (!driverInfo) {
      await session.abortTransaction();
      throw new Error("Driver not found");
    }
 
    // Get pending amount from ride
    const pendingAmount = ride.fareEstimate?.pendingAmount;
    if (!pendingAmount || pendingAmount <= 0) {
      await session.abortTransaction();
      throw new Error("Invalid pending amount in fare estimate");
    }
 
    // Create wallet entry for the payment
    await createRidePaymentEntry(
      ride.assignedDriver,
      driverInfo.model,
      ride._id,
      pendingAmount,
      "Online", 
      ride.razorpayFinalPaymentId, 
      session
    );
 
    // Check and apply driver achievements
    await checkDriverAchievements(ride.assignedDriver, session);
 
    // Commit transaction if everything succeeds
    await session.commitTransaction();
 
    // Fetch updated ride details for response (outside transaction)
    const updatedRide = await Ride.findById(rideId).populate("user");
 
    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      redirectUrl: `${process.env.FRONTEND_URL}/payment-success?rideId=${updatedRide._id}`,
      data: {
        rideId: updatedRide._id,
        paymentStatus: updatedRide.paymentStatus,
        rideStatus: updatedRide.rideStatus,
        advanceAmount: updatedRide.fareEstimate?.advanceAmount || 0,
        pendingAmount: updatedRide.fareEstimate?.pendingAmount || 0,
        transactionId: updatedRide.razorpayFinalPaymentId,
        paymentTime: formatDate(updatedRide.paymentCompletedAt),
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Remaining payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Remaining payment verification failed",
      error: error.message,
      redirectUrl: `${
        process.env.FRONTEND_URL
      }/payment-failed?error=${encodeURIComponent(error.message)}`,
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  oneWayRideBooking,
  rentalOutStationRideBooking,
  getAvailableCabsWithFare,
  confirmRideBooking,
  getAllRidesBooking,
  getRideBookingById,
  getUserForOptions,
  getPickupOptions,
  getRelationshipOptions,
  getValidPackages,
  confirmAdvancePayment,
  getRemainingPayment,
  payRemainingPayment,
  verifyRemainingPayment,
};