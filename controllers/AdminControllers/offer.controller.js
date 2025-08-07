const Offer = require("../../models/AdminModels/offer.model");

//✅ CreateOffer
const createOffer = async (req, res) => {
  try {
    const { userType, discountPercent, discountRate, couponCode, offerText } =
      req.body;

    if (!couponCode || !offerText) {
      return res.status(400).json({
        success: false,
        message: "Please provide userType, couponCode, and offerText.",
      });
    }

    if (!discountPercent && !discountRate) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one: discountPercent or discountRate.",
      });
    }

    const newOffer = new Offer({
      userType,
      ...(discountPercent && { discountPercent: discountPercent.toString() }),
      ...(discountRate && { discountRate: Number(discountRate) }),
      couponCode: couponCode.toUpperCase(),
      offerText,
    });

    await newOffer.save();

    return res.status(201).json({
      success: true,
      message: "Offer created successfully",
      newOffer, 
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed To Create Offer",
    });
  }
};

//✅ GetAllOffers

const getAllOffers = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", sortOrder = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Search filter (match offerText or couponCode or userType)
    const searchFilter = {
      isDeleted: false,
      $or: [
        { couponCode: { $regex: search, $options: "i" } },
        { userType: { $regex: search, $options: "i" } },
      ],
    };

    // Total count and paginated fetch
    const [totalOffers, offers] = await Promise.all([
      Offer.countDocuments(searchFilter),
      Offer.find(searchFilter)
        .sort(
          sortOrder === "asc"
            ? { createdAt: 1 }
            : sortOrder === "desc"
            ? { createdAt: -1 }
            : {}
        )
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    // Format discount values
    const formattedOffers = offers.map((offer) => {
      let discountDisplay = "";
      if (offer.discountPercent) {
        discountDisplay = `${offer.discountPercent}% off`;
      } else if (offer.discountRate) {
        discountDisplay = `₹${offer.discountRate} off`;
      }

      return {
        _id: offer._id,
        userType: offer.userType,
        couponCode: offer.couponCode,
        offerText: offer.offerText,
        discountDisplay,
        createdAt: offer.createdAt,
      };
    });

    const totalPages = Math.ceil(totalOffers / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    return res.status(200).json({
      success: true,
      message: "All Offers fetched successfully",
      totalOffers,
      totalPages,
      currentPage: page,
      previous: hasPrevious,
      next: hasNext,
      offers: formattedOffers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed To Fetch All Offers",
      error: error.message,
    });
  }
};

//✅ UpdateOffer
const updateOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    const { userType, discountPercent, discountRate, couponCode, offerText } =
      req.body;

    // Validate required field
    if (!userType) {
      return res.status(400).json({
        success: false,
        message: "Field 'userType' is required.",
      });
    }

    // Fetch existing offer
    const offerToUpdate = await Offer.findById(offerId);
    if (!offerToUpdate) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    // If couponCode is changing, check for duplicates
    if (couponCode && couponCode.toUpperCase() !== offerToUpdate.couponCode) {
      const existing = await Offer.findOne({
        couponCode: couponCode.toUpperCase(),
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Coupon code already exists",
        });
      }
    }

    // Update fields only if provided
    offerToUpdate.userType = userType;

    if (typeof discountPercent !== "undefined") {
      offerToUpdate.discountPercent = discountPercent;
    }

    if (typeof discountRate !== "undefined") {
      offerToUpdate.discountRate = discountRate;
    }

    if (couponCode) {
      offerToUpdate.couponCode = couponCode.toUpperCase();
    }

    if (offerText) {
      offerToUpdate.offerText = offerText;
    }

    // Ensure at least one of the discount fields is set
    if (!offerToUpdate.discountPercent && !offerToUpdate.discountRate) {
      return res.status(400).json({
        success: false,
        message:
          "At least one discount field (discountPercent or discountRate) must be provided.",
      });
    }

    await offerToUpdate.save();

    return res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      offer: offerToUpdate,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//✅ DeleteOffer
const deleteOffer = async (req, res) => {
  try {
    const offerId = req.params.id;

    // Check if the offer exists
    const offer = await Offer.findByIdAndUpdate(offerId, { isDeleted: true });
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found according to the given ID",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//✅DropDown Api's For Offer
const getDropDownForOffer = async (req, res) => {
  try {
    const OfferOptions = ["All", "User", "Driver"];
    return res.status(200).json({
      success: true,
      OfferOptions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed To Get DropDown For Offer",
      error: error.message,
    });
  }
};

module.exports = {
  createOffer,
  getAllOffers,
  updateOffer,
  deleteOffer,
  getDropDownForOffer,
};
