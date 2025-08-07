
const Booking = require("../models/AdminModels/bookings.model");
// ✅ Generate Advance Unique Booking ID
const generateUniqueBookingId = async () => {
    let bookingId;
    let isUnique = false;
  
    while (!isUnique) {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
      bookingId = `AB${randomNum}`;
      const existing = await Booking.findOne({ bookingId });
      if (!existing) isUnique = true;
    }
  
    return bookingId;
  };

  // ✅ Generate Online Unique Ride Booking ID
  const generateRideUniqueBookingId = async () => {
    let rideBookingId;
    let isUnique = false;
   
    while (!isUnique) {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
      rideBookingId = `OB${randomNum}`;
      const existing = await Booking.findOne({ rideBookingId });
      if (!existing) isUnique = true;
    }
   
    return rideBookingId;
  };
  module.exports = {generateUniqueBookingId, generateRideUniqueBookingId};