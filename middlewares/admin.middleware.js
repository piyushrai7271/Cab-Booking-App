const jwt = require("jsonwebtoken")
const Admin = require("../models/AdminModels/admin.model")


const authToken = async(req, res, next)=>{
    try {
        const token = req.headers.authorization?.split(" ")[1]; 
        if(!token){
            return res.status(401).json({success:false, message:"Unauthorized"})
        }
        const decoded = await jwt.verify(token, process.env.JWT_SECRET)
        if(!decoded){
            return res.status(400).json({
                success:false,
                message:"Invalid Token"
            })
        }
        const admin = await Admin.findById(decoded.id).select("-password")
        if(!admin){
            return res.status(404).json({
                success:false,
                message:"Admin not found"
            })
        }
       req.admin = admin
        next()
    } catch (error) {
        console.error('Authentication error:', error);
        if(error.name === "TokenExpiredError"){
            return res.status(401).json({
                success:false,
                message:"Token has expired"
            })
        }
        if(error.name === "JsonWebTokenError"){
            return res.status(401).json({
                success:false,
                message:"Invalid token"
            })
        }
        return res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

module.exports = {authToken}