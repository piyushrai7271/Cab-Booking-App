const Admin = require("../../models/AdminModels/admin.model");
const { sendPasswordResetEmail } = require("../../utils/sendEmail");

//✅ Register Admin
const register = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;

    const profileImage = req.files?.profileImage?.[0]?.path;

    // Validate fields
    if (!fullName || !phoneNumber || !email || !password) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ msg: "Admin already exists" });
    }

    //Hash Password
    const hashedPassword = await Admin.hashPassword(password);
    const admin = await Admin.create({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      profileImage,
    });
    return res.status(201).json({
      success: true,
      message: "Admin Registered Successfully",
      admin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Register Admin",
    });
  }
};

//✅ Login Admin
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //validate fields
    if (!email || !password) {
      return res.statsu(400).json({
        sucess: false,
        message: "All fields are required",
      });
    }

    //check Admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(499).json({
        success: false,
        message: "Admin not found",
      });
    }

    //chcek Password
    const isPasswordMatched = await admin.comparePassword(password);
    if (!isPasswordMatched) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //generate Token
    const token = await admin.generateToken();

    return res.status(200).json({
      success: true,
      message: "Admin Login Successfully",
      token,
      admin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      suceess: false,
      message: "Failed To Login ",
    });
  }
};

//✅ Forget Password
const forgetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not Found",
      });
    }

    const result = await sendPasswordResetEmail(admin); // <-- Pass the admin object here

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message, // You were mistakenly returning 'res' here
        otp: result.otp,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message,

      });
    }
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

//✅ verify OTP

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not Found",
      });
    }
    if (!admin.otp || admin.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }
    if (admin.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    admin.isVerified = true;
    admin.otp = undefined;
    admin.otpExpires = undefined;
    await admin.save();
    return res.status(200).json({
      success: true,
      message: "OTP Verified Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Verify OTP",
    });
  }
};

//✅ Reset Password
const resetPassword = async (req, res) => {
  const { email,  newPassword, confirmPassword } = req.body;

  // Validate that both fields are provided
  if (!newPassword || !confirmPassword) {
    return res.status(400).json({
      message: "Both newPassword and confirmPassword are required.",
    });
  }

  // Validate that passwords match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      message: "Passwords do not match.",
    });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !admin.isVerified) {
      return res.status(400).json({
        message: "OTP not verified. Reset password not allowed.",
      });
    }

    // Set new password and save
    const hashedPassword = await Admin.hashPassword(newPassword);
    admin.password = hashedPassword; 
    admin.isVerified = false; 
    await admin.save();

    return res.status(200).json({success: true, message: "Password reset successful." });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({ success: false, message: "Server Error." });
  }
};

//✅get Admin Profile
const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select("fullName email phoneNumber profileImage password createdAt updatedAt");
    if (!admin) {
      return res.status(400).json({
        success: false,
        mesaage: "Admin not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Admin Profile Fetched Successfully",
      fullName: admin.fullName,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
      profileImage: admin.profileImage,
      profilePassword: admin.password,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Fetch Admin Profile",
    });
  }
};

//✅ Update Admin
const UpdateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password } = req.body;

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (req.file) {
      admin.profileImage = req.file?.path;
    }
    if (fullName) admin.fullName = fullName;
    if (email) admin.email = email;
    if (phoneNumber) admin.phoneNumber = phoneNumber;
    if (password) {
      admin.password = await Admin.hashPassword(password);
    }
    await admin.save();
    return res.status(200).json({
      success: true,
      message: "Admin Profile Updated Successfully",
      admin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Update Admin Profile",
    });
  }
};

//✅Logout
const logout = async(req, res) =>{
  try {
    res.clearCookie("token");
    return res.status(200).json({
      success: true,
      message: "Admin Logout Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Logout",
    });
  }
} 

module.exports = {
  register,
  login,
  getProfile,
  UpdateProfile,
  verifyOtp,
  forgetPassword,
  resetPassword,
  logout,
};
