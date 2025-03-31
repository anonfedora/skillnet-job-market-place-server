const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.get("/profile", authenticateToken, userController.getProfile);
router.put("/profile", authenticateToken, userController.updateProfile);
router.post(
  "/certifications",
  authenticateToken,
  userController.addCertification
);
router.delete(
  "/certifications/:id",
  authenticateToken,
  userController.removeCertification
);

module.exports = router;
