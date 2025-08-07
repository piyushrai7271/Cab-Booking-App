const mongoose = require("mongoose");

const vehicleVariantSchema = new mongoose.Schema({
    vehicleType:{
        type:String,
        required:true,
    },
    variant:{
        type:String,
        required:true,
    }
}, {timestamps:true})

module.exports = mongoose.model("VehicleVariant", vehicleVariantSchema);