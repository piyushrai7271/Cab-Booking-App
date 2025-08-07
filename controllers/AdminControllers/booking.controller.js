
const Booking = require("../../models/AdminModels/bookings.model");
const Driver = require("../../models/AdminModels/driver.model");
const DriverAuth = require("../../models/DriverModels/driverAuth.model");
const vehicleTypeModel = require("../../models/AdminModels/vehicleType.model");
const { generateUniqueBookingId } = require("../../utils/bookingId");
const userModel = require("../../models/UserModels/user.model");
const moment = require("moment");
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_D3D9CzhhPmwAZe",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "gTPUidHTVpnljtGjLZHUcFV4",
});

// ✅ Create Booking
const createBooking = async (req, res) => {
  try {
    let {
      customerName,
      customerMobileNo,
      customerEmail,
      driverName,
      driverMobileNo,
      driverEmail,
      pickupLocation,
      stoppage,
      destination,
      typeOfTaxi,
      totalAmount,
      modeOfPayment,
      bookingType,
      bookingTime,
      bookingStatus,
      advancePayment,
      advancePaymentDate,
      finalPayment,
      finalPaymentDate,
    } = req.body;

    if (!bookingTime || typeof bookingTime !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid bookingTime. Use format like '10:30 AM'.",
      });
    }

    const fullDateTime = `${moment().format("YYYY-MM-DD")} ${bookingTime}`;
    if (!moment(fullDateTime, "YYYY-MM-DD hh:mm A", true).isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid bookingTime format. Use '10:30 AM'.",
      });
    }

    const formattedBookingTime = moment(fullDateTime, "YYYY-MM-DD hh:mm A").format("hh:mm A");
    const formattedBookingDate = moment(fullDateTime, "YYYY-MM-DD hh:mm A").format("DD-MM-YYYY");

    const formatAmount = (value) => parseFloat(value || 0).toFixed(2);
    totalAmount = formatAmount(totalAmount);
    advancePayment = formatAmount(advancePayment);
    finalPayment = formatAmount(finalPayment);

    const driverMobileNumber = Number(driverMobileNo);
    const driver = await Driver.findOne({
      driverName,
      mobileNo: driverMobileNumber,
      email: driverEmail,
      isVerified: true,
      isDeleted: false,
    }) || await DriverAuth.findOne({
      fullName: driverName,
      mobileNo: driverMobileNumber,
      email: driverEmail,
      isVerified: true,
      isDeleted: false,
    });

    if (!driver) {
      return res.status(400).json({
        success: false,
        message: "Driver not found. Please ensure correct name, mobile, and email.",
      });
    }

    const vehicleTypeDoc = await vehicleTypeModel.findOne({ vehicleType: typeOfTaxi });
    if (!vehicleTypeDoc) {
      return res.status(400).json({
        success: false,
        message: `Vehicle type '${typeOfTaxi}' is not registered.`,
      });
    }

    const customerMobileNumber = Number(customerMobileNo);
    const user = await userModel.findOne({
      fullName: customerName,
      phoneNumber: customerMobileNumber,
      email: customerEmail,
      isVerified: true,
      isDeleted: false,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found. Please ensure correct name, mobile, and email.",
      });
    }

    const bookingId = await generateUniqueBookingId();

    let paymentLinkUrl = null;
    let paymentLinkId = null;
    let otp = null;

    if (modeOfPayment === "Online") {
      otp = Math.floor(1000 + Math.random() * 9000);

      const paymentLink = await razorpay.paymentLink.create({
        amount: advancePayment * 100,
        currency: "INR",
        accept_partial: false,
        description: `Advance payment for booking #${bookingId}`,
        customer: {
          name: customerName || "Customer",
          contact: customerMobileNo.toString() || "",
          email: customerEmail || "",
        },
        notes: {
          bookingId,
          vehicleType: typeOfTaxi,
          pickupLocation,
          otp: otp.toString(),
        },
        callback_url: `${process.env.BASE_URL}/api/bookings/payment/verify`,
        callback_method: "get",
        options: {
          checkout: {
            name: "Taxi Booking",
            description: `Advance payment for your booking (₹${advancePayment})`,
            prefill: {
              contact: customerMobileNo.toString(),
              email: customerEmail,
            },
            theme: {
              color: "#3399cc",
            },
          },
        },
      });

      paymentLinkUrl = paymentLink.short_url;
      paymentLinkId = paymentLink.id;
    }

    const newBooking = await Booking.create({
      bookingId,
      customerName,
      customerMobileNo,
      customerEmail,
      driverName,
      driverMobileNo,
      driverEmail,
      pickupLocation,
      stoppage,
      destination,
      typeOfTaxi,
      totalAmount,
      modeOfPayment,
      bookingType,
      bookingTime: formattedBookingTime,
      bookingDate: formattedBookingDate,
      bookingStatus,
      advancePayment,
      advancePaymentDate: moment(advancePaymentDate, "DD-MM-YYYY").toDate(),
      finalPayment,
      finalPaymentDate: moment(finalPaymentDate, "DD-MM-YYYY").toDate(),
      paymentLinkUrl,
      paymentLinkId,
      otp,
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: newBooking,
      ...(modeOfPayment === "Online" && paymentLinkUrl && { paymentLink: paymentLinkUrl }),
    });

  } catch (error) {
    console.error("Error creating booking:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};


// ✅ Get All Bookings (Paginated + Filtered + Ascending by Time)
const getAllBookings = async (req, res) => {
  try {
  let{
      page = 1,
      limit = 10,
      bookingType,
      bookingStatus,
      fromDate,
      toDate,
      sortOrder = "desc",
      bookingId
    } = req.query;

    // ✅ If bookingId is provided, directly search by bookingId
    if (bookingId) {
      const booking = await Booking.findOne({ bookingId, isDeleted: false });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "No booking found with the given bookingId",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Booking fetched successfully",
        totalBookings: 1,
        bookings: [{
          ...booking._doc,
          advancePaymentDate: booking.advancePaymentDate ? new Date(booking.advancePaymentDate).toDateString() : null,
          finalPaymentDate: booking.finalPaymentDate ? new Date(booking.finalPaymentDate).toDateString() : null,
        }],
      });
    }

    // Parse pagination numbers
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Initialize filters
    const filter = { isDeleted: false };

    // Filter by bookingType
    const allowedTypes = ["Online Booking", "Advance Booking"];
    if (bookingType) {
      if (!allowedTypes.includes(bookingType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid bookingType. Allowed values are: ${allowedTypes.join(", ")}`,
        });
      }
      filter.bookingType = bookingType;
    }

    // Filter by bookingStatus
    const allowedStatuses = ["Dropped", "In Process", "Cancelled"];
    if (bookingStatus) {
      if (!allowedStatuses.includes(bookingStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid bookingStatus. Allowed values are: ${allowedStatuses.join(", ")}`,
        });
      }
      filter.bookingStatus = bookingStatus;
    }

    // Filter by date range
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    // Sort logic
    const sortOption = sortOrder === "asc" ? { createdAt: 1 } : { createdAt: -1 };

    // Paginated fetch
    const [totalBookings, bookings] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.find(filter).sort(sortOption).skip(skip).limit(limit),
    ]);

    const totalPages = Math.ceil(totalBookings / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    const formattedBookings = bookings.map(b => ({
      ...b._doc,
      advancePaymentDate: b.advancePaymentDate ? new Date(b.advancePaymentDate).toDateString() : null,
      finalPaymentDate: b.finalPaymentDate ? new Date(b.finalPaymentDate).toDateString() : null,
    }));

    return res.status(200).json({
      success: true,
      message: "All Bookings fetched successfully",
      totalBookings,
      totalPages,
      currentPage: page,
      previous: hasPrevious,
      next: hasNext,
      bookings: formattedBookings,
    });

  } catch (error) {
    console.error("Error fetching bookings:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};


// ✅ Get Booking By ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking By ID fetched successfully",
      booking,
    });
  } catch (error) {
    console.error("Error fetching booking by ID:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

// ✅ Update Booking by ID
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
 
  
    const {
      bookingId,
      driverName,
      driverMobileNo,
      driverEmail,
      ...filteredBody
    } = req.body;
 
    const updatedBooking = await Booking.findByIdAndUpdate(id, filteredBody, {
      new: true,
      runValidators: true,
    });
 
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }
 
    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update booking",
      error: error.message,
    });
  }
};

// ✅  Delete Booking 
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting booking:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete booking",
      error: error.message,
    });
  }
};


// ✅Get All Previous Booking
const getAllPreviousBooking = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      sortOrder = "desc"  // default is descending
    } = req.query;

    // Parse to integers
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Sort logic
    const sortOption = sortOrder === "asc"
      ? { bookingTime: 1 }
      : { bookingTime: -1 };

    // Filter for only active bookings
    const filter = { isDeleted: false };

    // Fetch paginated data
    const [totalBookings, bookings] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.find(filter)
        .select("driverName driverMobileNo driverEmail")
        .select("customerName customerMobileNo customerEmail")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
    ]);

    const totalPages = Math.ceil(totalBookings / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    return res.status(200).json({
      success: true,
      message: "All Previous Bookings fetched successfully",
      totalBookings,
      totalPages,
      currentPage: page,
      previous: hasPrevious,
      next: hasNext,
      bookings
    });

  } catch (error) {
    console.error("Error fetching previous bookings:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch previous bookings",
      error: error.message,
    });
  }
};


const getParticularUserBooking = async (req, res) => {
  try {

    const { customerEmail } = req.query;

    const bookings = await Booking.find({
      customerEmail: customerEmail.toLowerCase(),
      isDeleted: false,
    })
      .sort({ createdAt: -1 });

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found for this user",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bookings for this user retrieved successfully",
      bookings,
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch particular user bookings"
    })
  }
}

//✅ Get Previous Booking By DriverID
const getPreviousBookingById = async (req, res) => {
  try {
    const { driverEmail } = req.query;

    const bookings = await Booking.find({
      driverEmail: driverEmail.toLowerCase(),
      isDeleted: false,
    })
      .sort({ createdAt: -1 });

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found for this driver",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bookings for this driver retrieved successfully",
      bookings,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve bookings",
    });
  }
};


// ✅ DropDown API For Booking Type
const getBookingTypeOptions = (req, res) => {
  try {
    const options = ["Online Booking", "Advance Booking"];
    return res.status(200).json({ success: true, options });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Get Booking Type Options",
      error: error.message,
    });
  }
};

// ✅ DropDown API For Booking Status
const getBookingStatusOptions = (req, res) => {
  try {
    const options = ["Dropped", "In Process", "Cancelled"];
    return res.status(200).json({ success: true, options });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Get Booking Status Options",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getBookingTypeOptions,
  getBookingStatusOptions,
  getAllPreviousBooking,
  getPreviousBookingById,
  getParticularUserBooking
};