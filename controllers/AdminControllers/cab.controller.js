const Cab = require("../../models/AdminModels/cab.model");
const AdminDriver = require("../../models/AdminModels/driver.model");
const DriverModel = require("../../models/DriverModels/driverAuth.model");
const vehicleTypeModel = require("../../models/AdminModels/vehicleType.model");
const vehicleVariantModel = require("../../models/AdminModels/vehicleVariant.model");
const mongoose = require("mongoose");

//✅ Format service type
const formatServiceType = (input) => {
  return {
    oneWay: !!input?.oneWay,
    rental: !!input?.rental,
    outStation: !!input?.outStation,
  };
};

// ✅ Add Cab
const addCab = async (req, res) => {
  try {
    let {
      vehicleType,
      tagLine,
      vehicleNo,
      vehicleVariant,
      // address,
      // mobile,
      price,
      rateType,
      serviceType,
    } = req.body;

    if (
      !vehicleType ||
      !tagLine ||
      !vehicleNo ||
      !vehicleVariant ||
      // !address ||
      // !mobile ||
      !price ||
      !rateType ||
      !serviceType
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields including price and rateType are required",
      });
    }

    vehicleNo = vehicleNo.toUpperCase();

      // Validate vehicleType exists and get its image
      const vehicleTypeDoc = await vehicleTypeModel.findOne({ vehicleType });

      if (!vehicleTypeDoc) {
        return res.status(400).json({
          success: false,
          message: `Vehicle type '${vehicleType}' is not registered. Please add it first.`,
        });
      }
  
      const image = vehicleTypeDoc.image;

      const vehicleVariantDoc = await vehicleVariantModel.findOne({
        vehicleType: vehicleType,
        variant: vehicleVariant,
      });
      
      if (!vehicleVariantDoc) {
        return res.status(400).json({
          success: false,
          message: `Vehicle variant '${vehicleVariant}' is not registered under vehicle type '${vehicleType}'. Please add it first.`,
        });
      }
      
      
    const existingCab = await Cab.findOne({ vehicleNo });

    if (existingCab) {
      if (existingCab.priceOptions.length > 0) {
        return res.status(400).json({
          success: false,
          message: `This cab already has a price set. To add more, please update the cab instead.`,
        });
      }

      existingCab.priceOptions.push({ rateType, price });
      await existingCab.save();

      return res.status(200).json({
        success: true,
        message: "New price option added to existing cab successfully",
        cab: existingCab,
      });
    }

    const cab = await Cab.create({
      vehicleType,
      tagLine,
      vehicleNo,
      vehicleVariant,
      // address,
    
      image,
      priceOptions: [{ rateType, price }],
      serviceType: formatServiceType(serviceType),
    });

    return res.status(201).json({
      success: true,
      message: "Cab added successfully",
      cab: {
        _id: cab._id,
        image: cab.image,
        vehicleType: cab.vehicleType,
        tagLine: cab.tagLine,
        vehicleNo: cab.vehicleNo,
        vehicleVariant: cab.vehicleVariant,
        // address: cab.address,
        // mobile: cab.mobile,
        priceOptions: cab.priceOptions,
        serviceType: cab.serviceType,
      },
    });
  } catch (error) {
    console.error("Error in addCab:", error);
    return res.status(500).json({
      success: false,
      message: "Error in cab operation",
      error: error.message,
    });
  }
};



//✅ Get All Cabs
const getAllCabs = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", sortOrder = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Search filter (match against vehicleType, vehicleNo, tagLine)
    const searchFilter = {
      isDeleted: false,
      $or: [
        { vehicleType: { $regex: search, $options: "i" } },
        { vehicleNo: { $regex: search, $options: "i" } },
        { tagLine: { $regex: search, $options: "i" } },
        { vehicleVariant: { $regex: search, $options: "i" } },
      ],
    };

    // Total count and paginated fetch
    const [totalCabs, cabs] = await Promise.all([
      Cab.countDocuments(searchFilter),
      Cab.find(searchFilter)
        .select("_id image vehicleType  priceOptions vehicleVariant")
        .sort(
          sortOrder === "asc"
            ? { price: 1 }
            : sortOrder === "desc"
            ? { price: -1 }
            : {}
        )
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    // Format response
    const formattedCabs = cabs.map((cab) => ({
      id: cab._id,
      image: cab.image,
      vehicle: cab.vehicleType,
     vehicleVariant: cab.vehicleVariant,
      rate: cab.priceOptions && cab.priceOptions.length > 0 
    ? cab.priceOptions.map((option) => ({
        rateType: option.rateType,
        price: `₹${option.price} Rupees/${option.rateType === "Per KM" ? "KM" : "Hour"}`
      }))
    : [{ price: "Price not set" }],
    }));

    const totalPages = Math.ceil(totalCabs / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    return res.status(200).json({
      success: true,
      message: "All Cabs Fetched Successfully",
      totalCabs,
      totalPages,
      currentPage: page,
      previous: hasPrevious,
      next: hasNext,
      cabs: formattedCabs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Fetch All Cabs",
      error: error.message,
    });
  }
};

//✅ Get Cab By Id
const getCabById = async (req, res) => {
  try {
    const cab = await Cab.findById(req.params.id);
    if (!cab) {
      return res.status(404).json({
        success: false,
        message: "Cab not found",
      });
    }

    //✅ Filter ServiceType
    const filteredServiceType = {};
    for (const [key, value] of Object.entries(cab.serviceType)) {
      if (value === true && key !== "isDeleted") {
        filteredServiceType[key] = true;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Cab By Id fetched successfully",
      cab: {
        _id: cab._id,
        image: cab.image,
        vehicleType: cab.vehicleType,
        tagLine: cab.tagLine,
        vehicleNo: cab.vehicleNo,
        vehicleVariant: cab.vehicleVariant,
        prices: cab.priceOptions && cab.priceOptions.length > 0
        ? cab.priceOptions.map((option) => ({
            rateType: option.rateType,
            price: `₹${option.price} Rupees/${option.rateType === "Per KM" ? "KM" : "Hour"}`,
          }))
        : [{ price: "Price not set" }],
      
        serviceType: filteredServiceType,
      },
      createdAt: cab.createdAt,
    updatedAt: cab.updatedAt,
    });

    //Filter ServiceType
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Fetch Cab By Id",
      error: error.message,
    });
  }
};

//✅ Update Cab by Id
const updateCabById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vehicleType,
      tagLine,
      vehicleNo,
      vehicleVariant,
      priceOptions,
      serviceType,
    } = req.body;

    const image = req.file?.path;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Cab ID",
      });
    }

    const cab = await Cab.findById(id);
    if (!cab) {
      return res.status(404).json({
        success: false,
        message: "Cab not found",
      });
    }

    const updates = {};

    if (image) {
      updates.image = image;
    } else if (vehicleType && vehicleImages[vehicleType]) {
      updates.image = vehicleImages[vehicleType];
    }

    if (vehicleType) updates.vehicleType = vehicleType;
    if (tagLine) updates.tagLine = tagLine;
    if (vehicleNo) updates.vehicleNo = vehicleNo.toUpperCase().trim();
    if (vehicleVariant) updates.vehicleVariant = vehicleVariant.trim();
    // if (address) updates.address = address.trim();
    // if (mobile) updates.mobile = mobile;

    // 🔁 Merge priceOptions
    if (Array.isArray(priceOptions) && priceOptions.length > 0) {
      const existingOptions = [...(cab.priceOptions || [])];

      for (const incoming of priceOptions) {
        const index = existingOptions.findIndex(
          (opt) => opt.rateType === incoming.rateType
        );
        if (index !== -1) {
          // Update existing
          existingOptions[index].price = incoming.price;
        } else {
          // Add new
          existingOptions.push(incoming);
        }
      }

      updates.priceOptions = existingOptions;
    }

    if (serviceType) updates.serviceType = serviceType;

    const updatedCab = await Cab.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Cab updated successfully",
      cab: updatedCab,
    });
  } catch (error) {
    console.error("Update Cab Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update cab",
      error: error.message,
    });
  }
};


//✅ Delete Cab By id
const deletCabById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Cab Id",
      });
    }
    const cab = await Cab.findByIdAndUpdate(id, { isDeleted: true });
    if (!cab) {
      return res.status(404).json({
        success: false,
        message: "Cab not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Cab deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Delete Cab By Id",
      error: error.message,
    });
  }
};


//✅DropDown Api For Rate Type
const getRateTypeOptions = (req, res) => {
  try {
    const options = ["Per KM", "Per Hour"];
    return res.status(200).json({ success: true, options });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Get Rate Type Options",
      error: error.message,
    });
  }
};





module.exports = {
  addCab,
  getAllCabs,
  getCabById,
  updateCabById,
  deletCabById,
  getRateTypeOptions,
};
