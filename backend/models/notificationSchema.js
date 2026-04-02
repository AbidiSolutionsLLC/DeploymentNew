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
        'PROJECT_CREATED',
        'PROJECT_STATUS_UPDATED',
        'PROJECT_DELETED',
        'TASK_BLOCKED',
        'TASK_DELETED',
        'TASK_UPDATED',
        'TICKET_CREATED',
        'TICKET_CLOSED',
        'TICKET_DELETED',
        'DEPARTMENT_MEMBER_ADDED',
        'COMPANY_UPDATED',
        'USER_CREATED',
        'USER_DEACTIVATED',
        'EXPENSE_SUBMITTED',
        'EXPENSE_APPROVED',
        'EXPENSE_REJECTED',
        'EXPENSE_DELETED',
      ],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['leave', 'task', 'timetracker', 'ticket', 'project', 'user', 'department', 'company', 'expense'],
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
