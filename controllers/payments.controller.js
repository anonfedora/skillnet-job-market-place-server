const Payment = require("../models/Payment");
const Job = require("../models/Job");
const Wallet = require("../models/Wallet");
const Notification = require("../models/Notification");

exports.payForJobPosting = async (req, res) => {
  try {
    const { amount, transactionId } = req.body;
    const jobId = req.params.jobId;

    // Check if job exists and belongs to the user
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.creator.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to pay for this job",
      });
    }

    // Check if already paid
    if (job.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Job posting has already been paid for",
      });
    }

    // Create payment record
    const payment = new Payment({
      amount,
      payer: req.user.userId,
      type: "job_posting",
      relatedId: jobId,
      onModel: "Job",
      transactionId,
      status: "completed",
    });

    await payment.save();

    // Update job payment status
    job.paymentStatus = "paid";
    job.paymentId = payment._id;
    await job.save();

    // Update wallet transaction history
    await Wallet.findOneAndUpdate(
      { owner: req.user.userId },
      {
        $push: {
          transactions: {
            type: "payment",
            amount: -amount,
            transactionId,
            status: "completed",
          },
        },
        $inc: { balance: -amount },
      }
    );

    // Create notification
    const notification = new Notification({
      recipient: req.user.userId,
      type: "payment",
      title: "Payment Successful",
      message: `Your payment of ${amount} ETH for job "${job.title}" was successful`,
      relatedId: payment._id,
      onModel: "Payment",
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Pay for job posting error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process payment",
      error: error.message,
    });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({
      payer: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "relatedId",
        select: "title",
      });

    const total = await Payment.countDocuments({
      payer: req.user.userId,
    });

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
};

exports.getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate({
      path: "relatedId",
      select: "title",
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check if user is authorized to view this payment
    if (payment.payer.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this payment",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Get payment details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
};
