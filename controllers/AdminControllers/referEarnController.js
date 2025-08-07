const ReferEarnModel = require("../../models/AdminModels/referEarn.model");

//✅ Create ReferEarn
const createReferEarn = async (req, res) => {
  try {
      const { couponCode, discountPercent, discountRate, policy } = req.body;

      // Input validation
      if (!couponCode || !policy) {
          return res.status(400).json({
              success: false,
              message: "Fields 'couponCode' and 'policy' are required."
          });
      }

      if (!discountPercent && !discountRate) {
          return res.status(400).json({
              success: false,
              message: "Please provide either discountPercent or discountRate."
          });
      }

      if (discountPercent && discountRate) {
          return res.status(400).json({
              success: false,
              message: "Please provide only one of: discountPercent or discountRate, not both."
          });
      }

    //   Check for existing coupon code
      const existingReferAndEarn = await ReferEarnModel.findOne({ couponCode });
      if (existingReferAndEarn) {
          return res.status(400).json({
              success: false,
              message: "Coupon code already exists"
          });
      }

      // Create new refer & earn document
      const referEarn = await ReferEarnModel.create({
          couponCode:couponCode.toUpperCase(),
          ...(discountPercent && { discountPercent: discountPercent.toString() }),
          ...(discountRate && { discountRate: Number(discountRate) }),
          policy,
          image: req.file?.path || undefined
      });

      return res.status(201).json({
          success: true,
          message: "Refer and Earn created successfully",
          data: referEarn,
      });

  } catch (error) {
      console.error("Error in createReferEarn:", error);
      return res.status(500).json({
          success: false,
          message: `Failed to create Refer and Earn: ${error.message}`,
          
      });
  }
};
  
//✅ Get ReferEarn
const getReferAndEarn = async (req, res) => {
  try {
    const referEarn = await ReferEarnModel.findOne();
   return res.status(200).json({
        success:true,
        message:"Refer and Earn fetched successfully",
        referEarn,
    });
  } catch (error) {
    console.log(error);
  return res.status(500).json({ 
    success:false,
    message:"Failed to fetch Refer and Earn",
    error:error.message
  });
  }
};

//✅ Update ReferEarn

  const updateReferEarn = async (req, res) => {
    try {
        const { couponCode, discountPercent, discountRate, policy } = req.body;
        const image = req.file?.path;
        
        
       let referEarn = await ReferEarnModel.findOne();
        if(!referEarn){
            return res.status(404).json({
                success:false,
                message:"Refer and Earn not found"
            })
        }

        const updateData = {}
        if(couponCode) updateData.couponCode = couponCode.toUpperCase();
        if(policy) updateData.policy = policy;
        if(image) updateData.image = image;


        if (discountPercent && !referEarn.discountRate) {
            updateData.discountPercent = discountPercent;
            updateData.discountRate = undefined; // explicitly remove other
          } else if (discountRate && !referEarn.discountPercent) {
            updateData.discountRate = discountRate;
            updateData.discountPercent = undefined;
          }
        
       
        // Update and get the updated document
        referEarn = await ReferEarnModel.findByIdAndUpdate(
            referEarn._id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        return res.status(200).json({
            success:true,
            message:"Refer and Earn updated successfully",
            referEarn,
        })
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to update Refer and Earn",
            error:error.message
        })
    }
  }

module.exports = {
    createReferEarn,
    getReferAndEarn,
    updateReferEarn
}