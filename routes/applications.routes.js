const express = require("express");
const router = express.Router();
const applicationsController = require("../controllers/applications.controller");
const {
  authenticateToken,
  isEmployer,
  isJobSeeker,
} = require("../middlewares/auth.middleware");

router.post(
  "/:jobId",
  authenticateToken,
  isJobSeeker,
  applicationsController.applyForJob
);
router.get(
  "/job/:jobId",
  authenticateToken,
  isEmployer,
  applicationsController.getApplicationsForJob
);
router.get(
  "/user",
  authenticateToken,
  isJobSeeker,
  applicationsController.getUserApplications
);
router.get(
  "/:id",
  authenticateToken,
  applicationsController.getApplicationById
);
router.put(
  "/:id/status",
  authenticateToken,
  isEmployer,
  applicationsController.updateApplicationStatus
);

module.exports = router;
