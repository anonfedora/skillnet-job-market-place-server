const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer <token>"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    // Attach user to request object
    req.user = {
      userId: user._id,
      role: user.role,
      walletAddress: user.walletAddress,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    // Handle different JWT errors specifically
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        success: false,
        message: "Invalid or malformed token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        success: false,
        message: "Token has expired",
        expiredAt: error.expiredAt,
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Middleware to check if user is an employer
const isEmployer = (req, res, next) => {
  if (req.user.role !== "employer") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Employer privileges required",
    });
  }
  next();
};

// Middleware to check if user is a job seeker
const isJobSeeker = (req, res, next) => {
  if (req.user.role !== "jobSeeker") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Job seeker privileges required",
    });
  }
  next();
};

// Middleware to check if user has a connected wallet
const hasWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user.walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required for this action",
      });
    }

    next();
  } catch (error) {
    console.error("Wallet check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify wallet connection",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  authenticateToken,
  isEmployer,
  isJobSeeker,
  hasWallet,
};
