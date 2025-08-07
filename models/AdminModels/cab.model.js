const mongoose = require("mongoose");

const cabSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      required: [true, "Vehicle type is required"],
    },

    tagLine: {
      type: String,
      required: [true, "Tag line is required"],
      trim: true,
    },
    image: {
      type: String,
      // required: [true, "Image is required"],
    },
    vehicleNo: {
      type: String,
      required: [true, "Vehicle number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    vehicleVariant: {
      type: String,
      required: true,
      trim: true,
    },
    // address: {
    //   type: String,
    //   required: [true, "Address is required"],
    //   trim: true,
    // },
    // mobile: {
    //   type: String,
    //   required: [true, "Mobile number is required"],
    //   match: [/^[0-9]{10}$/, "Mobile number must be 10 digits"],
    // },
    priceOptions: [
      {
        rateType: {
          type: String,
          enum: ["Per KM", "Per Hour"],
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: [0, "Price cannot be negative"],
        }
      }
    ],
    
    serviceType: {
      oneWay: {
        type: Boolean,
        default: false,
      },
      rental: {
        type: Boolean,
        default: false,
      },
      outStation: {
        type: Boolean,
        default: false,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Cab = mongoose.model("Cab", cabSchema);
module.exports = Cab;
