const Job = require("../models/Job");
const User = require("../models/User");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");

exports.getAllJobs = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filters
    const filter = { status: "published" };
    if (req.query.location)
      filter.location = new RegExp(req.query.location, "i");
    if (req.query.jobType) filter.jobType = req.query.jobType;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.isUrgent === "true") filter.isUrgent = true;

    // Sorting
    const sort = {};
    if (req.query.sortBy) {
      if (req.query.sortBy === "latest") sort.createdAt = -1;
      else if (req.query.sortBy === "oldest") sort.createdAt = 1;
    } else {
      sort.createdAt = -1; // Default sort by latest
    }

    const jobs = await Job.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("creator", "username company");

    const total = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get all jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};

exports.searchJobs = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const jobs = await Job.find(
      {
        $text: { $search: query },
        status: "published",
      },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit)
      .populate("creator", "username company");

    const total = await Job.countDocuments({
      $text: { $search: query },
      status: "published",
    });

    res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Search jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search jobs",
      error: error.message,
    });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "creator",
      "username company profile.location"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Get job by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job",
      error: error.message,
    });
  }
};

exports.createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      responsibilities,
      requirements,
      location,
      jobType,
      salary,
      isUrgent,
      deadline,
      level,
      category,
      skills,
      status,
    } = req.body;

    const job = new Job({
      title,
      company,
      description,
      responsibilities,
      requirements: requirements || [],
      location,
      jobType,
      salary,
      isUrgent: isUrgent || false,
      deadline,
      level,
      category,
      skills: skills || [],
      creator: req.user.userId,
      status: status || "draft",
    });

    await job.save();

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create job",
      error: error.message,
    });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user is the creator
    if (job.creator.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this job",
      });
    }

    // Update job
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: updatedJob,
    });
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update job",
      error: error.message,
    });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user is the creator
    if (job.creator.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this job",
      });
    }

    await Job.findByIdAndRemove(req.params.id);

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete job",
      error: error.message,
    });
  }
};

exports.publishJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user is the creator
    if (job.creator.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to publish this job",
      });
    }

    // Check if payment is required and made
    if (job.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Job posting payment is required before publishing",
      });
    }

    // Publish job
    job.status = "published";
    job.updatedAt = Date.now();
    await job.save();

    res.status(200).json({
      success: true,
      message: "Job published successfully",
      data: job,
    });
  } catch (error) {
    console.error("Publish job error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to publish job",
      error: error.message,
    });
  }
};

exports.saveJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.userId;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Add job to user's saved jobs if not already saved
    const user = await User.findById(userId);
    if (user.savedJobs.includes(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Job already saved",
      });
    }

    user.savedJobs.push(jobId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Job saved successfully",
    });
  } catch (error) {
    console.error("Save job error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save job",
      error: error.message,
    });
  }
};

exports.unsaveJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.userId;

    // Remove job from user's saved jobs
    await User.findByIdAndUpdate(userId, { $pull: { savedJobs: jobId } });

    res.status(200).json({
      success: true,
      message: "Job removed from saved jobs",
    });
  } catch (error) {
    console.error("Unsave job error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove job from saved jobs",
      error: error.message,
    });
  }
};

exports.getUserDrafts = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const drafts = await Job.find({
      creator: req.user.userId,
      status: "draft",
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments({
      creator: req.user.userId,
      status: "draft",
    });

    res.status(200).json({
      success: true,
      data: {
        drafts,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get user drafts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch drafts",
      error: error.message,
    });
  }
};

exports.getUserPublishedJobs = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const jobs = await Job.find({
      creator: req.user.userId,
      status: "published",
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments({
      creator: req.user.userId,
      status: "published",
    });

    res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get user published jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch published jobs",
      error: error.message,
    });
  }
};

exports.getUserSavedJobs = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user.userId)
      .select("savedJobs")
      .populate({
        path: "savedJobs",
        populate: {
          path: "creator",
          select: "username company",
        },
      });

    const savedJobs = user.savedJobs.slice(skip, skip + limit);
    const total = user.savedJobs.length;

    res.status(200).json({
      success: true,
      data: {
        jobs: savedJobs,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get user saved jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch saved jobs",
      error: error.message,
    });
  }
};
