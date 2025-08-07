const FavoritePlace = require("../../models/UserModels/favouritePlace.model");
const Ride = require("../../models/UserModels/ride.model");




//✅ Get All Favourite Places
const getAllFavouritePlaces = async (req, res) => {
    try {
      const userId = req.user._id;
  
      const favorites = await FavoritePlace.find({ user: userId }).sort({ addedAt: -1 });
  
      return res.status(200).json({
        success: true,
        message: "All favorite places fetched successfully",
        count: favorites.length,
        favorites,
      });
    } catch (error) {
      console.error("Get All Favorite Places Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };

//✅ Book Ride
const bookRide = async(req, res) =>{
  try {
    const {id} = req.params;
    const userId = req.user._id;

    const favoritePlace = await FavoritePlace.findOne({ _id: id, user: userId })

    if (!favoritePlace) {
      return res.status(404).json({
        success: false,
        message: "Favorite place not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride Booked successfully",
      bookRide:{
        _id:favoritePlace._id,
        dropLocation:favoritePlace.location,
      },
    });
  } catch (error) {
    console.error("Book Ride Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

//✅Get Past Rides
const getPastRides = async (req, res) => {
  try {
    const userId = req.user._id;
    let { fromDate, toDate } = req.query;
 
    const parseDate = (str) => {
      const [day, month, year] = str.split("/");
      return new Date(`${year}-${month}-${day}`);
    };
 
    let query = { user: userId, rideStatus: "Completed" };
 
    if (fromDate && toDate) {
      try {
        const from = parseDate(fromDate);
        const to = parseDate(toDate);
        to.setHours(23, 59, 59, 999);
 
        if (from > to) {
          return res.status(400).json({ message: "fromDate must not be after toDate." });
        }
 
        query.createdAt = { $gte: from, $lte: to };
      } catch (err) {
        return res.status(400).json({ message: "Invalid date format. Use DD/MM/YYYY." });
      }
    }
 
    const rides = await Ride.find(query)
      .sort({ createdAt: -1 })
      .select("dropLocation distance");
 
    // Format the result
    const past = rides.map((ride) => {
      let distance = "";
 
      if (typeof ride.distance === "string") {
        distance = ride.distance;
      } else if (typeof ride.distance === "number") {
        // Convert number to km with 2 decimal places
        distance = `${ride.distance.toFixed(2)} km`;
      }
 
      return {
        dropLocation: ride.dropLocation || "N/A",
        distance : `${ride.distance} km`,
      };
    });
 
    res.status(200).json({
      success: true,
      message: "Completed ride drop locations with distance fetched successfully",
      past
    });
  } catch (error) {
    console.error("Error fetching ride history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ride history"
    });
  }
};
  
module.exports = {
    getAllFavouritePlaces,
    getPastRides,
    bookRide
}
