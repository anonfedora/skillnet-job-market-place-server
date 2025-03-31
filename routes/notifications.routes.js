const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notifications.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.get(
  "/",
  authenticateToken,
  notificationsController.getUserNotifications
);
router.put(
  "/:id/read",
  authenticateToken,
  notificationsController.markNotificationAsRead
);
router.put(
  "/read-all",
  authenticateToken,
  notificationsController.markAllNotificationsAsRead
);

module.exports = router;
