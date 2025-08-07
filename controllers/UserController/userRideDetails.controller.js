const Ride = require("../../models/UserModels/ride.model");
const Cab = require("../../models/AdminModels/cab.model");
const DriverAuth = require("../../models/DriverModels/driverAuth.model");
const Driver = require("../../models/AdminModels/driver.model");

const getPickupRideDetails = async (req, res) => {
    try {
      const { rideId } = req.params;
      const userId = req.auth?.id;
  
      if (!rideId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Ride ID and authenticated user ID are required",
        });
      }
  
      // ✅ Fetch the ride
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return res.status(404).json({
          success: false,
          message: "Ride not found",
        });
      }
  
      // ✅ Check if ride belongs to this user
      if (ride.user.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to view this ride",
        });
      }
  
      // ✅ Try to find driver from both models
      const driver =
        (await DriverAuth.findById(ride.assignedDriver)) ||
        (await Driver.findById(ride.assignedDriver));
  
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Assigned driver not found",
        });
      }
  
      // ✅ Get cab details
      const cab = await Cab.findById(ride.cabDetails);
      if (!cab) {
        return res.status(404).json({
          success: false,
          message: "Cab details not found",
        });
      }
  
      // ✅ Prepare response data
      const pickupDetails = {
        _id:driver._id,
        driverName: driver.driverName || driver.fullName,
        driverImage: driver.image,
        vehicleType: cab.vehicleType,
        vehicleNo: cab.vehicleNo,
        vehicleImage: cab.image,
        otp: ride.otp,

      };

       // ✅ Include rating only if it’s greater than 0
    if (ride.ratings > 0) {
      pickupDetails.rating = ride.ratings;
    }
  
      return res.status(200).json({
        success: true,
        message:
          "Accepted Driver Ride Details Fetched Successfully ",
        ridePickupDetails: pickupDetails,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

  module.exports = {
    getPickupRideDetails,
  };