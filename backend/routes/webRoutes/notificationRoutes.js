const express = require("express");
const router = express.Router();
const notifController = require("../../controllers/notificationController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");
const { sseClients } = require("../../utils/sseManager");
const catchAsync = require("../../utils/catchAsync");

// --- Notification Routes ---
// IMPORTANT: /mark-all-read and /unread-count must be declared BEFORE /:id routes
router.get("/stream", isLoggedIn, (req, res) => {
    const userId = (req.user._id || req.user.id).toString();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    sseClients.set(userId, res);
    console.log(`[SSE] Client connected: ${userId} (total: ${sseClients.size})`);

    // Send connection confirmation
    res.write(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`);

    // Heartbeat every 30s
    const heartbeat = setInterval(() => {
        try { res.write(": heartbeat\n\n"); } catch (e) { clearInterval(heartbeat); }
    }, 30000);

    req.on("close", () => {
        clearInterval(heartbeat);
        sseClients.delete(userId);
        console.log(`[SSE] Client disconnected: ${userId} (total: ${sseClients.size})`);
    });
});

router.get("/unread-count", isLoggedIn, catchAsync(notifController.getUnreadCount));
router.patch("/mark-all-read", isLoggedIn, catchAsync(notifController.markAllAsRead));
router.get("/", isLoggedIn, catchAsync(notifController.getNotifications));
router.patch("/:id/read", isLoggedIn, catchAsync(notifController.markAsRead));
router.delete("/:id", isLoggedIn, catchAsync(notifController.deleteNotification));

module.exports = router;