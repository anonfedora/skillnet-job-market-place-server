const express = require("express");
const router = express.Router();
const jobsController = require("../controllers/jobs.controller");
const {
  authenticateToken,
  isEmployer,
} = require("../middlewares/auth.middleware");

// Public routes
router.get("/", jobsController.getAllJobs);
router.get("/search", jobsController.searchJobs);
router.get("/:id", jobsController.getJobById);

// Protected routes
router.post("/", authenticateToken, isEmployer, jobsController.createJob);
router.put("/:id", authenticateToken, isEmployer, jobsController.updateJob);
router.delete("/:id", authenticateToken, isEmployer, jobsController.deleteJob);
router.post(
  "/:id/publish",
  authenticateToken,
  isEmployer,
  jobsController.publishJob
);
router.post("/:id/save", authenticateToken, jobsController.saveJob);
router.delete("/:id/save", authenticateToken, jobsController.unsaveJob);
router.get(
  "/user/drafts",
  authenticateToken,
  isEmployer,
  jobsController.getUserDrafts
);
router.get(
  "/user/published",
  authenticateToken,
  isEmployer,
  jobsController.getUserPublishedJobs
);
router.get("/user/saved", authenticateToken, jobsController.getUserSavedJobs);

module.exports = router;
