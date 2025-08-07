const jwt = require("jsonwebtoken");
const userModel = require("../models/UserModels/user.model");

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

// Helper to decode JWT
const decodeToken = async (authHeader) => {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("No token provided");
    }
    const token = authHeader.split(" ")[1];
    return jwt.verify(token, process.env.JWT_SECRET);
};

// Middleware: Full validation
const userValidateToken = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization") || req.header("authorization");
        const decoded = await decodeToken(authHeader);
        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
        }
        req.user = user;
        req.auth = {
            id: user._id,
            type: "User"
        }
        next();
    } catch (error) {
        console.error("Token error:", error);
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token has expired" });
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        return res.status(401).json({ success: false, message: error.message || "Unauthorized" });
    }
};

// Middleware: Extract user with limited fields
const extractUserFromToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (authHeader) {
            const decoded = await decodeToken(authHeader);
            const user = await userModel.findById(decoded.id).select("address");
            req.user = user;
        }
        next();
    } catch (error) {
        console.error("Token decode error:", error);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

module.exports = { userValidateToken, extractUserFromToken };
