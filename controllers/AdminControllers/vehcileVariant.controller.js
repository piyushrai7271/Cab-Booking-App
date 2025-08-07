const VehicleVariant = require("../../models/AdminModels/vehicleVariant.model");
const VehicleType = require("../../models/AdminModels/vehicleType.model");

//✅ Add Vehicle Variant
const addVehicleVariant = async (req, res) => {
    try {
      const { vehicleType, variant } = req.body;
  
      if (!vehicleType || !variant) {
        return res.status(400).json({
          success: false,
          message: "Vehicle type and variant are required",
        });
      }
  
      // Check that vehicleType exists by matching the string value
      const typeExists = await VehicleType.findOne({ vehicleType: vehicleType });
      if (!typeExists) {
        return res.status(404).json({
          success: false,
          message: `Vehicle type "${vehicleType}" not found`,
        });
      }
  
      // Optional: Check for duplicate variant under the same type
      const duplicate = await VehicleVariant.findOne({ vehicleType, variant });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "This vehicle variant already exists",
        });
      }
  
      const newVehicleVariant = await VehicleVariant.create({ vehicleType, variant });
  
      return res.status(201).json({
        success: true,
        message: "Vehicle variant added successfully",
        data: newVehicleVariant,
      });
    } catch (error) {
      console.error("Error in addVehicleVariant:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };

//✅ Get All Vehicle Variant
const getAllVehicleVariant = async (req, res) => {
    try {
      const vehicleVariants = await VehicleVariant.find().select("variant _id").sort({ variant: 1 }); ;
      return res.status(200).json({
        success: true,
        message: "All vehicle variants fetched successfully",
        vehicleVariants,
      });
    } catch (error) {
      console.error("Error in getAllVehicleVariant:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };

module.exports = {
    addVehicleVariant,
    getAllVehicleVariant,
}
