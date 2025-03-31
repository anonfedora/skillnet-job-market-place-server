const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");
const Notification = require("../models/Notification");

exports.applyForJob = async (req, res) => {
  try {
    const { resume, coverLetter } = req.body;
    const jobId = req.params.jobId;
    const userId = req.user.userId;

    // Check if job exists and is published
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Job is not available for applications",
      });
    }

    // Check if deadline has passed
    if (new Date(job.deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Application deadline has passed",
      });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: userId,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // Create new application
    const application = new Application({
      job: jobId,
      applicant: userId,
      resume,
      coverLetter,
    });

    await application.save();

    // Update applicants count
    job.applicantsCount += 1;
    await job.save();

    // Create notification for employer
    const applicant = await User.findById(userId);
    const notification = new Notification({
      recipient: job.creator,
      type: "application",
      title: "New Job Application",
      message: `${applicant.username} has applied for your job "${job.title}"`,
      relatedId: application._id,
      onModel: "Application",
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Apply for job error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
      error: error.message,
    });
  }
};

exports.getApplicationsForJob = async (req, res) => {
  try {
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
        message: "Not authorized to view applications for this job",
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const applications = await Application.find({ job: jobId })
      .populate("applicant", "username email profile")
      .sort({ submissionDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments({ job: jobId });

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get applications for job error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

exports.getUserApplications = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const applications = await Application.find({ applicant: req.user.userId })
      .populate({
        path: "job",
        populate: {
          path: "creator",
          select: "username company",
        },
      })
      .sort({ submissionDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments({
      applicant: req.user.userId,
    });

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get user applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("applicant", "username email profile")
      .populate({
        path: "job",
        populate: {
          path: "creator",
          select: "username company",
        },
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is authorized to view this application
    if (
      application.applicant._id.toString() !== req.user.userId &&
      application.job.creator._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this application",
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Get application by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
      error: error.message,
    });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const applicationId = req.params.id;

    const application = await Application.findById(applicationId).populate(
      "job",
      "creator title"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is the job creator
    if (application.job.creator.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this application",
      });
    }

    // Update status
    application.status = status;
    await application.save();

    // Create notification for applicant
    const notification = new Notification({
      recipient: application.applicant,
      type: "application",
      title: "Application Status Updated",
      message: `Your application for "${application.job.title}" has been updated to ${status}`,
      relatedId: application._id,
      onModel: "Application",
    });

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: application,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update application status",
      error: error.message,
    });
  }
};
