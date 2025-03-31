// File: app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");

// Route imports
const authRoutes = require("./routes/auth.routes");
const jobRoutes = require("./routes/jobs.routes");
const applicationRoutes = require("./routes/applications.routes");
const userRoutes = require("./routes/user.routes");
const notificationRoutes = require("./routes/notifications.routes");
const paymentRoutes = require("./routes/payments.routes");
const walletRoutes = require("./routes/wallet.routes");

// Middleware imports
const { authenticateToken } = require("./middlewares/auth.middleware");

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger for development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  });

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wallet", walletRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to SkillNet API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
