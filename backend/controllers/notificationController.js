const Notification = require('../models/notificationSchema');
const catchAsync = require('../utils/catchAsync');

/**
 * GET /api/notifications?page=1&limit=20&isRead=false
 * Returns paginated notifications for the logged-in user.
 */
exports.getNotifications = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, isRead } = req.query;
  const userId = req.user._id || req.user.id;
  const filter = { recipient: userId };
  if (isRead !== undefined) filter.isRead = isRead === 'true';

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: notifications,
    pagination: { page: Number(page), limit: Number(limit), total },
  });
});

/**
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications for the logged-in user.
 */
exports.getUnreadCount = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
  res.json({ success: true, count });
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read.
 */
exports.markAsRead = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }
  res.json({ success: true, data: notification });
});

/**
 * PATCH /api/notifications/mark-all-read
 * Marks all unread notifications for the logged-in user as read.
 */
exports.markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
});

/**
 * DELETE /api/notifications/:id
 * Hard-deletes a single notification (user-initiated).
 */
exports.deleteNotification = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: userId });
  res.json({ success: true, message: 'Notification deleted' });
});
