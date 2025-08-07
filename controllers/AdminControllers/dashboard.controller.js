const User = require("../../models/UserModels/user.model.js");
const Booking = require("../../models/AdminModels/bookings.model.js");
const Ride = require("../../models/UserModels/ride.model.js");
const moment = require("moment");

//✅ Get Total Customers Count
const getTotalCustomersCount = async (req, res) => {
    try {
        const totalCustomers = await User.countDocuments({ isDeleted: false });

        res.status(200).json({
            success: true,
            message: "Total customers fetched successfully",
            TotalCustomers: totalCustomers,
        });
    } catch (error) {
        console.error("Error fetching total customers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch total customers",
            error: error.message,
        });
    }
};



//✅ Get Total Bookings Count 
const getTotalBookingsCount = async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments({ isDeleted: false });

        res.status(200).json({
            success: true,
            message: "Total bookings fetched successfully",
            TotalBookings: totalBookings,
        });
    } catch (error) {
        console.error("Error fetching total bookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch total bookings",
            error: error.message,
        });
    }
};




//✅ Get Total Completed Rides Count 
const getTotalCompletedRidesCount = async (req, res) => {
    try {
        const totalCompletedRides = await Ride.countDocuments({
            rideStatus: "Completed"
        });

        res.status(200).json({
            success: true,
            message: "Total completed rides fetched successfully",
            TotalCompletedRides: totalCompletedRides,
        });
    } catch (error) {
        console.error("Error fetching completed rides:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch completed rides",
            error: error.message,
        });
    }
};




//✅ Get Total Cancelled Bookings Count 
const getTotalCancelledBookingCount = async (req, res) => {
    try {
        const cancelBookings = await Booking.countDocuments({
            bookingStatus: "Cancelled",
            isDeleted: false,
        });

        res.status(200).json({
            success: true,
            message: "Cancelled bookings fetched successfully",
            TotalCancelledBookings: cancelBookings,
        });
    } catch (error) {
        console.error("Error fetching cancelled bookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch cancelled bookings",
            error: error.message,
        });
    }
};

//✅ Get Booking Overview
const getBookingOverview = async (req, res) => {
  try {
    const { from, to } = req.query;

    const now = moment();
    const currentYearStart = now.clone().startOf("year").toDate();
    const currentMonthStart = now.clone().startOf("month").toDate();
    const previousMonthStart = now.clone().subtract(1, "month").startOf("month").toDate();
    

    let dateFilterActive = false;
    let startDate, endDate;

    if (from && to) {
      startDate = moment(from, "DD-MM-YYYY").utc().startOf("day").toDate();
      endDate = moment(to, "DD-MM-YYYY").utc().endOf("day").toDate();
      

      if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json({ message: "Invalid date format. Use DD-MM-YY" });
      }
      dateFilterActive = true;
    }

    const bookingQuery = {
      isDeleted: false,
      bookingType: "Advance Booking",
    };

    const rideQuery = {
      bookingType: "Online Booking",
    };

    const userQueryAlt = {
      $or: [
        { createdAt: { $gte: currentMonthStart } },
        {
          $and: [
            { createdAt: { $gte: previousMonthStart } },
            { createdAt: { $lt: currentMonthStart } }
          ]
        }
      ],
      isDeleted: false
    };

    if (dateFilterActive) {
      bookingQuery.createdAt = { $gte: startDate, $lte: endDate };
      rideQuery.createdAt = { $gte: startDate, $lte: endDate };
      userQueryAlt.$or = [
        { createdAt: { $gte: startDate, $lte: endDate } }
      ];
    } else {
      bookingQuery.createdAt = { $gte: currentYearStart };
      rideQuery.createdAt = { $gte: currentYearStart };
    }

    const [bookings, rides, users] = await Promise.all([
      Booking.find(bookingQuery),
      Ride.find(rideQuery),
      User.find(userQueryAlt),
    ]);

    const countByMonth = (items) => {
      const counts = new Array(12).fill(0);
      items.forEach(item => {
        const month = new Date(item.createdAt).getUTCMonth();
        counts[month]++;
      });
      return counts;
    };

    const bookingCounts = countByMonth(bookings);
    const rideCounts = countByMonth(rides);
    const customerCounts = countByMonth(users);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const data = months.map((monthName, index) => ({
      monthName,
      totalBookings: bookingCounts[index],
      totalRides: rideCounts[index],
      totalCustomer: customerCounts[index],
    }));

    let responseData = data;

    if (dateFilterActive) {
      const startMonth = startDate.getMonth();
      const endMonth = endDate.getMonth();
      responseData = data.filter((_, index) => index >= startMonth && index <= endMonth);
    }

    return res.status(200).json({
      success: true,
      message: "Booking overview fetched successfully",
      BookingOverview: responseData,
    });

  } catch (error) {
    console.error("Booking Overview Error:", error);
    return res.status(500).json({
      message: "Failed to fetch booking overview",
      error: error.message,
    });
  }
};


  
//✅ Get Income Overview
const getIncomeOverview = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "From and To dates are required in DD-MM-YYYY format" });
    }

    const startDate = moment(from, "DD-MM-YYYY").startOf("day").toDate();
    const endDate = moment(to, "DD-MM-YYYY").endOf("day").toDate();

    if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ message: "Invalid date format. Use DD-MM-YYYY" });
    }

    // 🔍 Fetch Bookings with status "Dropped"
    const bookings = await Booking.find({
      createdAt: { $gte: startDate, $lte: endDate },
      bookingStatus: "Dropped",
    });

    // 🔍 Fetch Rides with status "Completed"
    const rides = await Ride.find({
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus:"Paid",
      rideStatus: "Completed",
    });

    // 🧮 Group income by day of the week (0 = Sunday, 6 = Saturday)
    const incomeByDay = new Array(7).fill(0);

    bookings.forEach((booking) => {
      const dayIndex = new Date(booking.createdAt).getDay(); // 0 (Sunday) - 6 (Saturday)
      const amount = parseFloat(booking.totalAmount) || 0;
      incomeByDay[dayIndex] += amount;
    });

    rides.forEach((ride) => {
      const dayIndex = new Date(ride.createdAt).getDay();
      const amount = parseFloat(ride.fareEstimate?.totalFare) || 0;
      incomeByDay[dayIndex] += amount;
    });

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const result = days.map((day, index) => ({
      day,
      totalIncome: incomeByDay[index],
    }));

    return res.status(200).json({
      IncomeOverview: result,
    });
  } catch (err) {
    console.error("Income Overview Error:", err);
    return res.status(500).json({
      message: "Failed to fetch income overview",
      error: err.message,
    });
  }
};
  
  

//✅ Dropdown Api For Year
 const getYearDropdownData = async (req, res) => {
    try {
      const bookings = await Booking.find().select("createdAt");
  
      if (!bookings.length) {
        return res.status(404).json({
          success: false,
          message: "No orders found",
        });
      }
  
      const yearsSet = new Set();
      bookings.forEach((order) => {
        const year = new Date(order.createdAt).getFullYear();
        yearsSet.add(year);
      });
  
      const years = Array.from(yearsSet).sort((a, b) => b - a); 
  
      return res.status(200).json({
        success: true,
        message: "Years fetched successfully",
        years,
      });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };
  

module.exports = {
    getTotalCustomersCount,
    getTotalBookingsCount,
    getTotalCompletedRidesCount,
    getTotalCancelledBookingCount,
    getIncomeOverview,
    getBookingOverview,
    getYearDropdownData,
};





