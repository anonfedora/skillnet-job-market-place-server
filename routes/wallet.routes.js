const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.get("/", authenticateToken, walletController.getWalletInfo);
router.get(
  "/transactions",
  authenticateToken,
  walletController.getTransactions
);
router.post("/connect", authenticateToken, walletController.connectWallet);

module.exports = router;
