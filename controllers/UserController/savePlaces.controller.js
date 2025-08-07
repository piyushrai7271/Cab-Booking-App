const savedPlaces = require("../../models/UserModels/savePlaces.model");


//✅Add Saved Places
const addPlaces = async (req, res) => {
    try {
        const { title, address } = req.body;
        if (!title || !address) {
            return res.status(400).json({
                success: false,
                message: "Title and Address are required"
            })
        }
        const addNewPlaces = await savedPlaces.create({
            user: req.user._id,
            title,
            address
        })
        return res.status(200).json({
            success: true,
            message: "Saved Places Added Successfully",
            addNewPlaces
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed To Add Saved Places",
            error: error.message
        })
    }
}

//✅ GetAll Saved Places

const getAllSavedPlaces = async (req, res) => {
    try {
      let {
        page = 1,
        limit = 10,
        sortOrder = "", // "asc" or "desc"
      } = req.query;
  
      page = parseInt(page);
      limit = parseInt(limit);
  
      const sortOption =
        sortOrder === "asc"
          ? { createdAt: 1 }
          : sortOrder === "desc"
          ? { createdAt: -1 }
          : {};
  
      const filter = { user: req.user._id };
  
      const [totalPlaces, savedPlacesList] = await Promise.all([
        savedPlaces.countDocuments(filter),
        savedPlaces
          .find(filter)
          .sort(sortOption)
          .skip((page - 1) * limit)
          .limit(limit),
      ]);
  
      const totalPages = Math.ceil(totalPlaces / limit);
      const hasPrevious = page > 1;
      const hasNext = page < totalPages;
  
      return res.status(200).json({
        success: true,
        message: "Saved Places Fetched Successfully",
        totalPlaces,
        totalPages,
        currentPage: page,
        previous: hasPrevious,
        next: hasNext,
        data: savedPlacesList,
      });
    } catch (error) {
      console.error("Get All Saved Places Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed To Fetch Saved Places",
        error: error.message,
      });
    }
  };
  


//✅ Get Favourite Places By Id
module.exports = {
    addPlaces,
    getAllSavedPlaces,
 

}