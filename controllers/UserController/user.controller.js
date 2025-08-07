const userModel = require("../../models/UserModels/user.model");
const jwt = require("jsonwebtoken");


//✅ Register
const register = async (req, res) => {
  try {
    const { fullName, phoneNumber } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!fullName) missingFields.push("Full Name");
    if (!phoneNumber) missingFields.push("Phone Number");


    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missingFields.join(", ")}`,
      });
    }

    const isValidPhone = /^[6-9]\d{9}$/.test(phoneNumber);
    if (!isValidPhone) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid mobile number format." });
    }

    const existingUser = await userModel.exists({
      phoneNumber,
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

    const notVerifiedUser = await userModel.findOne({
      phoneNumber,
      isVerified: false,
    });
    if (notVerifiedUser) {
      await userModel.findOneAndUpdate(
        { phoneNumber },
        { otp, otpExpiresAt, fullName }
      );
    } else {
      const newUser = new userModel({
        fullName,
        phoneNumber,
        otp,
        otpExpiresAt,
      });
      await newUser.save();
    }

    return res.status(201).json({
      success: true,
      message: "OTP sent successfully.",
      isForRegistration: true,
      data: { otp, phoneNumber },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//✅ login
const login = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber)
      return res.status(400).json({ message: "Phone number is required" });

    const isValidPhone = /^[6-9]\d{9}$/.test(phoneNumber);
    if (!isValidPhone) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid mobile number format." });
    }

    // Check if user exists
    const user = await userModel.findOne({ phoneNumber });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "User is not verified. Please complete OTP verification during registration.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    return res
      .status(200)
      .json({
        message: "OTP sent successfully",
        success: true,
        data: { otp, phoneNumber },
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//✅ verifyOtp
const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp)
      return res
        .status(400)
        .json({ message: "Phone number and OTP are required" });

    const user = await userModel.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== Number(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // OTP verified → clear otp
    user.otp = null;
    user.otpExpiresAt = null;

    let isRegistered = false;
    if (!user.isVerified) {
      user.isVerified = true; // ✅ only set during registration
      isRegistered = true;
    }

    await user.save();

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      userId: user._id,
      userName: user.fullName,
      userPhone: user.phoneNumber,
      userImage: user.image,
      token,
      ...(isRegistered && { isRegistered: true })
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//✅ Resend OTP
const resendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber)
      return res.status(400).json({ message: "Phone number is required" });

    const user = await userModel.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Send OTP
    // await client.messages.create({
    //     body: `Your new OTP is ${otp}`,
    //     from: twilioPhone,
    //     to: `+91${phoneNumber}`,
    // });

    // Update OTP
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

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

//✅ Get User
const getProfile = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user._id)
      .select("-otp -otpExpiresAt -address");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//✅ Dropdwon Api For All Genders
const getAllGenders = async (req, res) => {
  try {
    const genders = ["Male", "Female", "Others"];
    return res.status(200).json({ success: true, message: "All Genders Fetch Successfully", genders })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

//✅ Update User
const updateProfile = async (req, res) => {
  try {
    const updatableFields = [
      "fullName",
      "phoneNumber",
      "gender",
      "email",
      "address"
    ];
    const updates = {};
    const image = req.file?.path;

    // Dynamically collect valid fields from req.body
    for (const field of updatableFields) {
      if (req.body[field]) updates[field] = req.body[field];
    }

    if (image) updates.image = image;

    // If no fields are provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    // Update and return the new user data
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true, select: "-otp -otpExpiresAt" }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//✅ logout
const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "User Logout successfully", success: true });
  } catch (error) {
    console.error("Server Error:", error);
    res
      .status(500)
      .json({ message: "Server error", success: false, error: error.message });
  }
};


//✅get All User
const getAllUser = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      sortOrder = "", // 'asc' or 'desc'
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const filter = { isDeleted: false };

    const [totalUsers, users] = await Promise.all([
      userModel.countDocuments(filter),
      userModel.find(filter)
        .select("-otp -otpExpiresAt -address")
        .sort(
          sortOrder === "asc"
            ? { fullName: 1 }
            : sortOrder === "desc"
              ? { fullName: -1 }
              : {}
        )
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    return res.status(200).json({
      success: true,
      message: "All Users Fetched Successfully By Admin",
      totalUsers,
      totalPages,
      currentPage: page,
      previous: hasPrevious,
      next: hasNext,
      users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//✅Get User By Id
const getUserById = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id, { isDeleted: false }).select("-otp -otpExpiresAt ")
    return res.status(200).json({
      success: true,
      message: "User By ID Fetch Successfully By Admin",
      user
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}



//✅Edit User By Admin
const editUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ["fullName", "phoneNumber", "gender", "email", "address"];

    // Build update object dynamically
    const updates = Object.fromEntries(
      allowedFields
        .filter(field => req.body[field])
        .map(field => [field, req.body[field]])
    );

    // Handle optional image upload
    if (req.file?.path) {
      updates.image = req.file.path;
    }

    // Return early if no updates provided
    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
        select: "-otp -otpExpiresAt",
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully by admin.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("editUserByAdmin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}


//✅Delete User By Admin
const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Check if user exists
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Step 2: Check if already deleted
    if (user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "User is already deleted.",
      });
    }

    // Step 3: Soft delete
    user.isDeleted = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully by admin.",
    });
  } catch (error) {
    console.error("deleteUserByAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

//✅ User Blocked by Admin
const blockUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch only the blockedStatus to decide toggle logic
    const user = await userModel.findById(id).select("blockedStatus");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isBlocked = user.blockedStatus === "Blocked";
    const newStatus = isBlocked ? "Active" : "Blocked";

    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { blockedStatus: newStatus },
      { new: true, select: "blockedStatus fullName" }
    );

    return res.status(200).json({
      success: true,
      message: `User has been ${isBlocked ? "unblocked" : "blocked"} successfully.`,
      updatedUser,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Block User By Admin",
    });
  }
};

//✅ Get All Users For Dropdown
const getAllUsersForDropdown = async (req, res) => {
  try {
    const { search } = req.query;
 
    const query = { isVerified: true,isDeleted: false };
    if (search) {
      query.fullName = { $regex: search }; // case-sensitive search
    }
 
    const users = await userModel.find(query).select("_id fullName email phoneNumber isVerified");
 
    return res.status(200).json({
      success: true,
      message: "Users Dropdown fetched successfully",
      users: users.map(user => ({
        id: user._id,
        name: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isVerified: user.isVerified,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};


module.exports = { register, login, editUserByAdmin, verifyOtp, resendOtp, getProfile, getAllGenders, updateProfile, logout, getAllUser, getUserById, deleteUserByAdmin, blockUserByAdmin, getAllUsersForDropdown };
