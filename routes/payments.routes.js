const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.post(
  "/job/:jobId",
  authenticateToken,
  paymentsController.payForJobPosting
);
router.get("/history", authenticateToken, paymentsController.getPaymentHistory);
router.get("/:id", authenticateToken, paymentsController.getPaymentDetails);

module.exports = router;
