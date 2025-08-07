const jwt = require("jsonwebtoken");
const DriverModel = require("../models/DriverModels/driverAuth.model");
const DriverAdminModel = require("../models/AdminModels/driver.model"); // Make sure path is correct

const driverAuthToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: "Invalid Token",
      });
    }

    // First try to find in DriverAdminModel (self-registered drivers)
    let driver = await DriverAdminModel.findById(decoded.id).select("-password");
    let driverType = "SelfRegistered";

    // If not found, try to find in DriverModel (admin-added drivers)
    if (!driver) {
      driver = await DriverModel.findById(decoded.id);
      driverType = "AdminAdded";
    }

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    req.driver = driver;
    req.auth = {
      id: driver._id,
      type: driverType, // "SelfRegistered" or "AdminAdded"
      modelType: driverType === "SelfRegistered" ? "DriverAuth" : "Driver"
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = { driverAuthToken };