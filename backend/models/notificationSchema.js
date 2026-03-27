const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'LEAVE_APPROVED',
        'LEAVE_REJECTED',
        'LEAVE_REQUEST_SUBMITTED',
        'TASK_ASSIGNED',
        'TASK_STATUS_CHANGED',
        'TASK_DUE_SOON',
        'TASK_OVERDUE',
        'TIMESHEET_APPROVED',
        'TIMESHEET_REJECTED',
        'TIMESHEET_SUBMITTED',
        'TICKET_RESPONSE_ADDED',
        'TICKET_STATUS_CHANGED',
        'TICKET_ASSIGNED',
        'PROJECT_MEMBER_ADDED',
        'USER_CREATED',
        'USER_DEACTIVATED',
      ],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['leave', 'task', 'timetracker', 'ticket', 'project', 'user'],
      },
      entityId: { type: mongoose.Schema.Types.ObjectId },
    },
    // Optional company scope for multi-company isolation
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for most common query: all unread for a user, newest first
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Auto-delete notifications older than 90 days (TTL index)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Notification', notificationSchema);
