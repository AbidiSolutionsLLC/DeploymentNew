const Notification = require('../models/notificationSchema');

class NotificationService {
  async getNotifications(userId, query) {
    const { page = 1, limit = 20, isRead, entityType } = query;
    const filter = { recipient: userId };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (entityType) filter['relatedEntity.entityType'] = entityType;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return { notifications, total, page: Number(page), limit: Number(limit) };
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });
  }

  async markAsRead(userId, notificationId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  async deleteNotification(userId, notificationId) {
    return Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
  }
}

module.exports = new NotificationService();
