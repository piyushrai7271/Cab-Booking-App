// models/VehicleType.js
const mongoose = require("mongoose");

const vehicleTypeSchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("VehicleType", vehicleTypeSchema);
