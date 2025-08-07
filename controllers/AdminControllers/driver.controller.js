const Driver = require("../../models/AdminModels/driver.model");
const DriverAuthModel = require("../../models/DriverModels/driverAuth.model");
// const BookingModel = require("../../models/AdminModels/bookings.model");
const RideModel = require("../../models/UserModels/ride.model");
const mongoose = require("mongoose");

//✅ create or add driver
const addDriver = async (req, res) => {
  try {
    const {
      driverName,
      mobileNo,
      city,
      address,
      email,
      aadharNumber,
      panCardNumber,
      // Flat guarantor fields from form-data
      guarantor1Name,
      guarantor1Mobile,
      guarantor1License,
      guarantor2Name,
      guarantor2Mobile,
      guarantor2License
    } = req.body;

    // Check required basic fields
    if (!driverName || !mobileNo || !city || !address || !email || !aadharNumber || !panCardNumber) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing: driverName, mobileNo, city, address, phone, email, aadharNumber, panCardNumber"
      });
    }
    

    // Validate guarantor fields
    if (!guarantor1Name || !guarantor1Mobile || !guarantor1License ||
        !guarantor2Name || !guarantor2Mobile || !guarantor2License) {
      return res.status(400).json({
        success: false,
        message: "All guarantor fields are required (guarantor1Name, guarantor1Mobile, guarantor1License, guarantor2Name, guarantor2Mobile, guarantor2License)"
      });
    }

    // Check if files are uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files were uploaded"
      });
    }

    const {
      image,
      aadharCardImage,
      panCardImage,
      licenceCardImage,
      vehicleRCImage,
      otherDocuments,
    } = req.files;
    // console.log(req.files);

    // Validate required files
    if (!image || !aadharCardImage || !licenceCardImage || !vehicleRCImage || !panCardImage) {
      return res.status(400).json({
        success: false,
        message: "Required files must be uploaded: image, aadharCardImage, panCardImage, licenceCardImage, vehicleRCImage"
      });
    }


    let otherDocumentsPaths = [];

    if (otherDocuments && Array.isArray(otherDocuments)) {
      otherDocumentsPaths = otherDocuments.map(doc => doc.path);
    } else if (otherDocuments) {
      otherDocumentsPaths = [otherDocuments.path];
    }
    
    // Create guarantor objects
    const guarantor1 = {
      name: guarantor1Name,
      mobile: guarantor1Mobile,
      licenseNo: guarantor1License
    };

    const guarantor2 = {
      name: guarantor2Name,
      mobile: guarantor2Mobile,
      licenseNo: guarantor2License
    };

    // Create new driver document
    const newDriver = new Driver({
      driverName,
      mobileNo,
      city,
      address, // ADD THIS
      email,
      image: image[0].path,
      aadharNumber,
      aadharCardImage: aadharCardImage[0].path,
      panCardNumber,
      panCardImage: panCardImage[0].path,
      licenceCardImage: licenceCardImage[0].path,
      vehicleRCImage: vehicleRCImage[0].path,
      otherDocuments: otherDocumentsPaths,
      guarantor1,
      guarantor2
    });
    
 

    // Save to database
    const savedDriver = await newDriver.save();

   return  res.status(201).json({
      success: true,
      message: "Driver added successfully",
      data: savedDriver
    });

  } catch (error) {
    console.error("Error adding driver:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Error adding driver"
    });
  }
};

//✅ get All Drivers
const getAllDrivers = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      sortOrder = "", // 'asc' or 'desc'
      search = "",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const defaultSort = { createdAt: -1 };

    const searchFilter = search
  ? {
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: String(search), $options: "i" } },
        { mobileNo: !isNaN(search) ? parseInt(search) : null },
        { driverName: { $regex: search, $options: "i" } },
      ].filter(Boolean), // removes null if mobileNo not valid number
    }
  : {};



   
    
    const driverAuthData = await DriverAuthModel.find({
      isDeleted: false,
      ...searchFilter,
    })
      .select("fullName image email mobileNo blockedStatus isVerified")
      .sort(defaultSort);

    // Query Driver model with isDeleted:false + search filter
    const driverData = await Driver.find({
      isDeleted: false,
      ...searchFilter,
    })
      .select("driverName image email mobileNo blockedStatus isVerified")
      .sort(defaultSort);

      const combinedDrivers = [
        ...driverAuthData.map(driver => ({
          _id: driver._id,
          name: driver.fullName,
          email: driver.email,
          mobileNo: driver.mobileNo,
          image: driver.image || "",
          blockedStatus: driver.blockedStatus,
          isVerified: driver.isVerified,
          // modelType: "DriverAuth"
        })),
        ...driverData.map(driver => ({
          _id: driver._id,
          name: driver.driverName,
          email: driver.email,
          mobileNo: driver.mobileNo,
          image: driver.image || "",
          blockedStatus: driver.blockedStatus,
          isVerified: driver.isVerified,
          // modelType: "Driver"
        })),
      ];

      
    // ✅ Sort after combining
      if (sortOrder === "asc") {
        combinedDrivers.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortOrder === "desc") {
        combinedDrivers.sort((a, b) => b.name.localeCompare(a.name));
      } else {
        combinedDrivers.sort((a, b) => b.createdAt - a.createdAt);
      }

      const totalDrivers = combinedDrivers.length;
      const totalPages = Math.ceil(totalDrivers / limit);
      const paginatedDrivers = combinedDrivers.slice((page - 1) * limit, page * limit);
  
      res.status(200).json({
        success: true,
        message: "Drivers fetched from both Driver and DriverAuth models",
        totalDrivers,
        totalPages,
        currentPage: page,
        previous: page > 1,
        next: page < totalPages,
        drivers: paginatedDrivers,
      });

  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//✅ Get Driver By id
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
 
    // Try to find the driver from Driver
    let driver = await Driver.findById(id);
 
    // If not found in Driver, check DriverAuth
    if (!driver) {
      driver = await DriverAuthModel.findById(id);
    }
 
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found in either model",
      });
    }
 
    // Fetch latest 3 rides assigned to this driver
    const rides = await RideModel.find({ assignedDriver: id })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("user", "fullName");
 
    // Format the rides
    const formattedRides = rides.map((ride) => {
      const rideDate = new Date(ride.updatedAt || ride.createdAt);
      const date = rideDate.toLocaleDateString("en-GB");
      const time = rideDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
 
      return {
        date,
        time,
        customerName: ride.user?.fullName || "N/A",
        totalPrice: `₹${ride.fareEstimate?.totalAmount || 0} (${ride.paymentMethod})`,
        paymentStatus: ride.paymentStatus,
        pickupAddress: ride.pickupLocation,
        dropAddress: ride.dropLocation,
      };
    });
 
    // Respond with driver and 3 formatted rides
    res.status(200).json({
      success: true,
      message: "Driver fetched successfully",
      data: {
        driver,
        recentRides: formattedRides,
      },
    });
  } catch (error) {
    console.error("Get Driver By Id Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching driver",
      error: error.message,
    });
  }
};
 
 

//✅update driver By Id
const updateDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
 
      //✅ Parse guarantor fields if sent as JSON strings (from form-data)
      if (typeof updateFields.guarantor1 === 'string') {
        updateFields.guarantor1 = JSON.parse(updateFields.guarantor1);
      }
      if (typeof updateFields.guarantor2 === 'string') {
        updateFields.guarantor2 = JSON.parse(updateFields.guarantor2);
      }
    
      //✅ Find existing driver
    const existingDriver = await Driver.findById(id);
    if (!existingDriver) {
      return res.status(404).json({ message: "Driver not found" });
    }
 
    
    const updatedData = {
      driverName: updateFields.driverName || existingDriver.driverName,
      city: updateFields.city || existingDriver.city,
      address: updateFields.address || existingDriver.address,
      email: updateFields.email || existingDriver.email,
      aadharNumber: updateFields.aadharNumber || existingDriver.aadharNumber,
      panCardNumber: updateFields.panCardNumber || existingDriver.panCardNumber,

      //✅ Preserve the existing guarantors by default
      guarantor1: existingDriver.guarantor1,
      guarantor2: existingDriver.guarantor2
    };
 
    
    if (updateFields.guarantor1) {
      updatedData.guarantor1 = {
        ...existingDriver.guarantor1.toObject(),
        ...updateFields.guarantor1
      };
    }

    if (updateFields.guarantor2) {
      updatedData.guarantor2 = {
        ...existingDriver.guarantor2.toObject(),
        ...updateFields.guarantor2
      };
    }
 
    //✅ Handle file updates if needed
    const image = req.files?.image?.[0]?.path;
    const aadharCardImage = req.files?.aadharCardImage?.[0]?.path;
    const panCardImage = req.files?.panCardImage?.[0]?.path;
    const licenceCardImage = req.files?.licenceCardImage?.[0]?.path;
    const vehicleRCImage = req.files?.vehicleRCImage?.[0]?.path;
    const otherDocuments = req.files?.otherDocuments?.map((file) => file.path);
 
    if (image) updatedData.image = image;
    if (aadharCardImage) updatedData.aadharCardImage = aadharCardImage;
    if (panCardImage) updatedData.panCardImage = panCardImage;
    if (licenceCardImage) updatedData.licenceCardImage = licenceCardImage;
    if (vehicleRCImage) updatedData.vehicleRCImage = vehicleRCImage;
    if (otherDocuments) updatedData.otherDocuments = otherDocuments;
 
    const updatedDriver = await Driver.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });
 
    if (!updatedDriver) {
      return res.status(404).json({ message: "Driver not found" });
    }
 
    res.status(200).json({
      success:true,
      message: "Driver updated successfully",
      data: updatedDriver,
    });
  } catch (error) {
    console.error("Update Driver Error:", error);
 
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `${duplicateField} must be unique`,
        error: error.message,
      });
    }
 
    res.status(500).json({
      message: "Something went wrong while updating driver",
      error: error.message,
    });
  }
};

//✅ Delete Driver By id
const deleteDriverById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Driver ID",
      });
    }

    const driver = await Driver.findById(id);
    const driverAuth = await DriverAuthModel.findById(id);

    if (!driver && !driverAuth) {
      return res.status(404).json({
        success: false,
        message: "Driver not found in either collection.",
      });
    }

    // Check if both are already deleted
    if (
      (!driver || driver.isDeleted) &&
      (!driverAuth || driverAuth.isDeleted)
    ) {
      return res.status(400).json({
        success: false,
        message: "Driver is already deleted in both collections.",
      });
    }

    let deletedInDriver = false;
    let deletedInDriverAuth = false;

    if (driver && !driver.isDeleted) {
      driver.isDeleted = true;
      await driver.save();
      deletedInDriver = true;
    }

    if (driverAuth && !driverAuth.isDeleted) {
      driverAuth.isDeleted = true;
      await driverAuth.save();
      deletedInDriverAuth = true;
    }

    return res.status(200).json({
      success: true,
      message: `Driver deleted successfully in:${deletedInDriver ? " Driver" : ""}${deletedInDriverAuth ? " DriverAuth" : ""} collection.`,
    });

  } catch (error) {
    console.error("Delete Driver Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete driver by ID",
      error: error.message,
    });
  }
};

//✅ Block Driver By id
const blockDriverByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver ID.",
      });
    }

    // Try to find in Driver model first
    let driver = await Driver.findById(id).select("blockedStatus");
    let modelType = "Driver";

    if (!driver) {
      // If not found in Driver, try DriverAuth
      driver = await DriverAuthModel.findById(id).select("blockedStatus fullName");
      modelType = "DriverAuth";
    }

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found in either model.",
      });
    }

    // Toggle block status
    const isBlocked = driver.blockedStatus === "Blocked";
    const newStatus = isBlocked ? "Active" : "Blocked";

    const updatedDriver =
      modelType === "Driver"
        ? await Driver.findByIdAndUpdate(
            id,
            { blockedStatus: newStatus },
            { new: true, select: "blockedStatus driverName" }
          )
        : await DriverAuthModel.findByIdAndUpdate(
            id,
            { blockedStatus: newStatus },
            { new: true, select: "blockedStatus fullName" }
          );

    return res.status(200).json({
      success: true,
      message: `Driver  has been ${newStatus.toLowerCase()} successfully.`,
      data: updatedDriver,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle block status.",
      error: error.message,
    });
  }
};

//✅ Get Driver Ride History
const getDriverRideHistory = async (req, res) => {
  try {
    const { driverType } = req.driver; // Assume middleware sets this
    const driverId = req.driver._id;

    if (!driverId || !["admin", "auth"].includes(driverType)) {
      return res.status(400).json({ message: "Invalid or missing driver info" });
    }

    let filter = {};

    if (driverType === "admin") {
      filter.adminDriver = driverId;
    } else if (driverType === "auth") {
      filter.authDriver = driverId;
    }

    const rides = await RentalRide.find(filter)
      .sort({ createdAt: -1 })
      .populate(driverType === "admin" ? "adminDriver" : "authDriver")
      .populate("user", "name email")
      .lean();

    const rideHistory = rides.map((ride, index) => ({
      date: new Date(ride.createdAt).toLocaleDateString("en-GB"),
      customerName: ride.user?.name || "N/A",
      time: ride.pickupLater?.pickupTime || "Now",
      totalPrice: `₹${ride.fareEstimate?.total || 0} (${ride.paymentMethod})`,
      pickupAddress: ride.pickupLocation,
      dropAddress: ride.dropLocation || "N/A",
    }));

    return res.status(200).json({ success: true, data: rideHistory });
  } catch (error) {
    console.error("Error fetching ride history:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

//✅ Get Driver Ride History Details
const getDriverRideHistoryDetails = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { fromDate, toDate, page = 1 } = req.query;
 
    const query = { assignedDriver: driverId };
 
    // Handle date filtering if both dates are provided
    if (fromDate && toDate) {
      const [fromDay, fromMonth, fromYear] = fromDate.split('/');
      const [toDay, toMonth, toYear] = toDate.split('/');
 
      const startDate = new Date(`${fromYear}-${fromMonth}-${fromDay}T00:00:00.000Z`);
      const endDate = new Date(`${toYear}-${toMonth}-${toDay}T23:59:59.999Z`);
 
      query.createdAt = { $gte: startDate, $lte: endDate };
    }
 
    const limit = 10;
    const skip = (Number(page) - 1) * limit;
 
    const totalRides = await RentalRide.countDocuments(query);
    const rides = await RentalRide.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "fullName");
 
    const formattedRides = rides.map((ride) => {
      const rideDate = new Date(ride.updatedAt || ride.createdAt);
      const date = rideDate.toLocaleDateString("en-GB");
      const time = rideDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
 
      return {
        date,
        time,
        customerName: ride.user?.fullName || "N/A",
        totalPrice: `₹${ride.fareEstimate?.totalAmount || 0} (${ride.paymentMethod})`,
        paymentStatus: ride.paymentStatus,
        pickupAddress: ride.pickupLocation,
        dropAddress: ride.dropLocation,
      };
    });
 
    return res.status(200).json({
      success: true,
      message: "Driver ride history fetched successfully",
      currentPage: Number(page),
      totalPages: Math.ceil(totalRides / limit),
      totalRides,
      data: formattedRides,
    });
  } catch (error) {
    console.error("Ride history fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching ride history",
    });
  }
};

module.exports = {
  addDriver,
  getAllDrivers,
  getDriverById,
  updateDriverById,
  deleteDriverById,
  blockDriverByAdmin,
  getDriverRideHistory,
  getDriverRideHistoryDetails
};