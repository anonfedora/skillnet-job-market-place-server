const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    responsibilities: {
      type: String,
      required: true,
    },
    requirements: [String],
    location: {
      type: String,
      required: true,
    },
    jobType: {
      type: String,
      enum: ["remote", "onsite", "hybrid"],
      required: true,
    },
    salary: {
      type: Number,
      required: false,
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    deadline: {
      type: Date,
      required: true,
    },
    level: {
      type: String,
      enum: ["entry", "junior", "mid", "senior", "lead"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    skills: [String],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },
    applicantsCount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    paymentId: {
      type: String,
    },
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

// Add text index for search functionality
jobSchema.index({ title: "text", description: "text", skills: "text" });

const Job = mongoose.model("Job", jobSchema);
module.exports = Job;
