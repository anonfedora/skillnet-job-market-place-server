const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ["deposit", "withdrawal", "payment"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        transactionId: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "pending",
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
