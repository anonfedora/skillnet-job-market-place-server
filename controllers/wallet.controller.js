const Wallet = require("../models/Wallet");
const User = require("../models/User");

exports.getWalletInfo = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ owner: req.user.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error("Get wallet info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wallet information",
      error: error.message,
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const wallet = await Wallet.findOne({ owner: req.user.userId })
      .select("transactions")
      .slice("transactions", [skip, limit]);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const total = wallet.transactions.length;

    res.status(200).json({
      success: true,
      data: {
        transactions: wallet.transactions,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};

exports.connectWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    // Check if wallet address is already connected to another account
    const existingWallet = await Wallet.findOne({ address: walletAddress });
    if (existingWallet) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is already connected to another account",
      });
    }

    // Update user's wallet address
    await User.findByIdAndUpdate(req.user.userId, { walletAddress });

    // Create or update wallet
    const wallet = await Wallet.findOneAndUpdate(
      { owner: req.user.userId },
      { address: walletAddress },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Wallet connected successfully",
      data: wallet,
    });
  } catch (error) {
    console.error("Connect wallet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to connect wallet",
      error: error.message,
    });
  }
};
