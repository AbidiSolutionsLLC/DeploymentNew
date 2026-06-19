const notificationService = require("../services/notificationService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.getNotifications = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const result = await notificationService.getNotifications(userId, req.query);
  
  res.json(ApiResponse.success(
    result.notifications,
    "Notifications retrieved successfully",
    { pagination: { page: result.page, limit: result.limit, total: result.total } }
  ));
});

exports.getUnreadCount = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const count = await notificationService.getUnreadCount(userId);
  res.json(ApiResponse.success(null, "Unread count retrieved", { count }));
});

exports.markAsRead = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const notification = await notificationService.markAsRead(userId, req.params.id);
  
  if (!notification) {
    return res.status(404).json(ApiResponse.error('Notification not found', 404));
  }
  res.json(ApiResponse.success(notification, "Notification marked as read"));
});

exports.markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  await notificationService.markAllAsRead(userId);
  res.json(ApiResponse.success(null, 'All notifications marked as read'));
});

exports.deleteNotification = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  await notificationService.deleteNotification(userId, req.params.id);
  res.json(ApiResponse.success(null, 'Notification deleted'));
});
