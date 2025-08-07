const jwt = require("jsonwebtoken");
const DriverAuthModel = require("../../models/DriverModels/driverAuth.model");
const DriverModel = require("../../models/AdminModels/driver.model");
const CabModel = require("../../models/AdminModels/cab.model");


//✅ Signup
const signupDriver = async (req, res) => {
  try {
    const { fullName, mobileNo, email } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!fullName) missingFields.push("Full Name");
    if (!mobileNo) missingFields.push("Mobile Number");
    if (!email) missingFields.push("Email");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missingFields.join(", ")}`,
      });
    }

    const isValidPhone = /^[6-9]\d{9}$/.test(mobileNo);
    if (!isValidPhone) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid mobile number format." });
    }

    // First check if driver exists in admin model
    const adminDriver = await DriverModel.findOne({ mobileNo });
    if (adminDriver) {
      return res.status(400).json({
        success: false,
        message: "You are already registered by admin. Please login directly.",
      });
    }

    // Then check if already self-registered
    const existingUser = await DriverAuthModel.findOne({
      mobileNo,
      isVerified: true,
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this mobile number",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    const notVerifiedUser = await DriverAuthModel.findOne({
      mobileNo,
      isVerified: false,
    });

    if (notVerifiedUser) {
      await DriverAuthModel.findOneAndUpdate(
        { mobileNo },
        { otp, otpExpiresAt, fullName, email }
      );
    } else {
      const newUser = new DriverAuthModel({
        fullName,
        mobileNo,
        email,
        otp,
        otpExpiresAt,
      });
      await newUser.save();
    }

    return res.status(201).json({
      success: true,
      message: "OTP sent successfully.",
      isForRegistration: true,
      data: { otp, mobileNo },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
//✅ login
const loginDriver = async (req, res) => {
  try {
    const { mobileNo } = req.body;
    if (!mobileNo)
      return res.status(400).json({ message: "Phone number is required" });

    const isValidPhone = /^[6-9]\d{9}$/.test(mobileNo);
    if (!isValidPhone) {
      return res.status(400).json({ success: false, message: "Invalid mobile number format." });
    }

    const [adminDriver, selfRegisteredDriver] = await Promise.all([
      DriverModel.findOne({ mobileNo }),
      DriverAuthModel.findOne({ mobileNo }),
    ]);

    // ✅ Admin Driver => login directly without OTP
    if (adminDriver) {
      const payload = {
        id: adminDriver._id,
        driverType: "Driver"
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET);

      return res.status(200).json({
        success: true,
        message: "Login successful (admin-added driver)",
        driverId: adminDriver._id,
        driverName: adminDriver.driverName,
        mobileNo: adminDriver.mobileNo,
        image: adminDriver.image || "",
        token,
        driverType: "Driver",
        isAdminAddedDriver: true
      });
    }

    // ✅ DriverAuth => Send OTP
    if (!selfRegisteredDriver) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await DriverAuthModel.updateOne(
      { mobileNo },
      { otp, otpExpiresAt }
    );

    return res.status(200).json({
      message: "OTP sent successfully",
      success: true,
      data: { otp, mobileNo },
      isAdminAddedDriver: false
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//✅ verifyOtp
const verifyOtpDriver = async (req, res) => {
  try {
    const { mobileNo, otp } = req.body;
    if (!mobileNo || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and OTP are required"
      });
    }

    // Check in both models
    const [adminDriver, authDriver] = await Promise.all([
      DriverModel.findOne({ mobileNo }),
      DriverAuthModel.findOne({ mobileNo })
    ]);

    const driver = adminDriver || authDriver;
    const driverType = adminDriver ? 'Driver' : 'DriverAuth';

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    if (driver.otp !== Number(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (driver.otpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    // OTP verified → clear otp
    driver.otp = null;
    driver.otpExpiresAt = null;

    let isRegistered = false;
    if (driverType === 'Driver' && !driver.isVerified) {
      driver.isVerified = true;
      isRegistered = true;
    }

    await driver.save();

    const payload = {
      id: driver._id,
      driverType // Include driver type in JWT payload
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      driverId: driver._id,
      driverName: driver.driverName || driver.fullName,
      mobileNo: driver.mobileNo,
      image: driver.image || driver.vehicleImage,
      token,
      driverType,
      ...(isRegistered && { isRegistered: true })
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



//✅ Get Driver Profile
const getDriverProfile = async (req, res) => {
  try {
    const driverId = req.driver;
    if (!driverId) {
      return res.status(400).json({ message: "Driver ID is required" });
    }

    const driver = await DriverAuthModel.findById(driverId).select("-otp -otpExpiresAt").lean()

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (driver.DOB) {
      const d = new Date(driver.DOB);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      driver.DOB = `${day}-${month}-${year}`;
    }
    res.status(200).json({
      message: "Driver profile fetched successfully",
      data: driver,
    });
  } catch (error) {
    console.error("Get Driver Profile Error:", error);
    res.status(500).json({
      message: "Something went wrong while fetching driver profile",
      error: error.message,
    });
  }
};


//✅ Resend OTP
const resendDriverOtp = async (req, res) => {
  try {
    const { mobileNo } = req.body;
    if (!mobileNo)
      return res.status(400).json({ message: "Phone number is required" });

    const driver = await DriverAuthModel.findOne({ mobileNo });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);


    // Update OTP
    driver.otp = otp;
    driver.otpExpiresAt = otpExpiresAt;
    await driver.save();

    return res.status(200).json({
      message: "OTP resent successfully",
      success: true,
      data: { otp },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


//✅ Update Driver Profile
const updateDriverProfile = async (req, res) => {
  try {
    const driverId = req.driver.id;

    const allowedUpdates = [
      'fullName', 'mobileNo', 'email', 'gender', 'DOB',
      'vehicleType', 'registrationNo', 'drivingLicenseNo',
      'aadharNumber', 'upiId'
    ];

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedUpdates.includes(key))
    );

    // ✅ Direct field validations
    if (updates.DOB) {
      const [day, month, year] = updates.DOB.split('-');
      const dob = new Date(`${year}-${month}-${day}`);
      const age = new Date().getFullYear() - dob.getFullYear();
      if (isNaN(dob.getTime()) || age < 18) {
        return res.status(400).json({
          success: false,
          message: "DOB must be in DD-MM-YYYY format and user must be at least 18 years old"
        });
      }
      updates.DOB = dob;
    }

    // ✅ Field Validation of Vehicle Type
    if (updates.vehicleType) {
      const cabSchemaPaths = CabModel.schema.paths;
      const allowedVehicleTypes = cabSchemaPaths.vehicleType.enumValues;

      if (!allowedVehicleTypes.includes(updates.vehicleType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid vehicleType. Allowed types: ${allowedVehicleTypes.join(', ')}`
        });
      }
    }
    // ✅ Field Validation of Registration Number
    if (updates.registrationNo && !/^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/.test(updates.registrationNo)) {
      return res.status(400).json({ success: false, message: "Invalid registration number format. Example: MH12AB1234" });
    }

    // ✅ Field Validation of Driving License Number
    if (updates.drivingLicenseNo && !/^[A-Z]{2}\d{2}\s\d{11,13}$/.test(updates.drivingLicenseNo)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driving license number. Example: MH12 12345678901"
      });
    }
    //✅ Field Validation of Aadhar Number
    if (updates.aadharNumber && !/^\d{12}$/.test(updates.aadharNumber)) {
      return res.status(400).json({ success: false, message: "Invalid Aadhar number. Must be a 12-digit number." });
    }

    //✅ Field Validation of UPI ID
    if (updates.upiId && !/^[\w.-]+@[\w]{3,}$/.test(updates.upiId)) {
      return res.status(400).json({ success: false, message: "Invalid UPI ID format. Example: name@upi or abc@oksbi" });
    }

    //✅ File Uploads
    if (req.files) {
      const fileFields = ['vehicleImage', 'aadharCardImage', 'licenceCardImage', 'registrationImage'];
      fileFields.forEach(field => {
        if (req.files[field]?.[0]?.path) {
          updates[field] = req.files[field][0].path;
        }
      });
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update"
      });
    }

    const updatedDriver = await DriverAuthModel.findByIdAndUpdate(
      driverId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
        lean: true,
      }
    ).select('-otp -otpExpiresAt');

    if (!updatedDriver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    if (updatedDriver.DOB) {
      const d = new Date(updatedDriver.DOB);
      updatedDriver.DOB = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    }
    return res.status(200).json({
      success: true,
      message: "Driver profile updated successfully",
      data: updatedDriver
    });
  } catch (error) {
    console.error("Update Driver Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update driver profile",
      error: error.message
    });
  }
};



//✅ logout
const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Driver Logout successfully", success: true });
  } catch (error) {
    console.error("Server Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong while logging out driver", success: false, error: error.message });
  }
};

//✅ Get Driver Auth Dropdown
const getDriverAuthDropdown = async (req, res) => {
  try {
    const { search } = req.query;

    const searchRegex = search ? new RegExp(search, "i") : null;

    // Build queries
    const driverAuthQuery = { isVerified: true, isDeleted: false };
    if (searchRegex) {
      driverAuthQuery.fullName = { $regex: searchRegex };
    }

    const adminDriverQuery = { isVerified: true, isDeleted: false };
    if (searchRegex) {
      adminDriverQuery.driverName = { $regex: searchRegex };
    }

    // Fetch both drivers in parallel
    const [authDrivers, adminDrivers] = await Promise.all([
      DriverAuthModel.find(driverAuthQuery).select("_id fullName email mobileNo isVerified"),
      DriverModel.find(adminDriverQuery).select("_id driverName email mobileNo isVerified"),
    ]);

    // Normalize both results into common format
    const formattedDrivers = [
      ...authDrivers.map(driver => ({
        id: driver._id,
        name: driver.fullName,
        email: driver.email,
        mobileNo: driver.mobileNo || null,
        isVerified: driver.isVerified,
        // source: "DriverAuth",
      })),
      ...adminDrivers.map(driver => ({
        id: driver._id,
        name: driver.driverName,
        email: driver.email,
        mobileNo: driver.mobileNo || null,
        isVerified: driver.isVerified,
        // source: "Driver",
      })),
    ];

    res.status(200).json({
      success: true,
      message: "Driver dropdown fetched successfully",
      drivers: formattedDrivers,
    });
  } catch (error) {
    console.error("Error fetching combined drivers:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch combined drivers",
      error: error.message,
    });
  }
};

 






module.exports = {
  signupDriver,
  loginDriver,
  verifyOtpDriver,
  getDriverProfile,
  resendDriverOtp,
  updateDriverProfile,
  logout,
  getDriverAuthDropdown,
}