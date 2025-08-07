const newVehicles = require("../../models/AdminModels/vehicleType.model");

//✅ Add New Vehicle Type
const addNewVehicleType = async(req, res) =>{
    try {
        const { vehicleType } = req.body;
        const image = req.file?.path;
    
        if (!vehicleType || !image) {
          return res.status(400).json({
            success: false,
            message: "Both vehicleType and image are required.",
          });
        }
    
        // Check if it already exists
        const existing = await newVehicles.findOne({ vehicleType });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: "VehicleType already exists.",
          });
        }
    
        const newVehicle = new newVehicles({ vehicleType, image });
        await newVehicle.save();
    
        return res.status(201).json({
          success: true,
          message: "Vehicle type added successfully",
        newVehicle,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error in vehicleType operation",
            error: error.message,
        });
    }
}


//✅ Get All Vehicle Type
const getAllVehicleType = async(req, res) => {
    try {
        const vehicles = await newVehicles.find().select("vehicleType image -_id").sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "All vehicle types fetched successfully",
            vehicles,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error in vehicleType operation",
            error: error.message,
        });
    }
}


module.exports = {
    addNewVehicleType,
    getAllVehicleType,
 
}