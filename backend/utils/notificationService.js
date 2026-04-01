const Notification = require('../models/notificationSchema');
const { sseClients } = require('./sseManager');

/**
 * Creates a notification document in MongoDB and pushes it to the
 * connected SSE client (if currently online).
 *
 * NOTE: Always call inside a try/catch in the caller so that a notification
 * failure never breaks the primary API response.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.recipient  - User _id
 * @param {string}          params.type       - Notification type enum value
 * @param {string}          params.title      - Short heading
 * @param {string}          params.message    - Full human-readable message
 * @param {Object}          [params.relatedEntity] - { entityType, entityId }
 * @param {string|ObjectId} [params.company]  - Company _id (optional)
 */
const createNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedEntity = null,
  company = null,
}) => {
  try {
    const payload = { recipient, type, title, message };
    if (relatedEntity) payload.relatedEntity = relatedEntity;
    if (company) payload.company = company;

    const notification = await Notification.create(payload);

    // Push via SSE if the recipient is currently connected
    const clientRes = sseClients.get(recipient.toString());
    if (clientRes) {
      try {
        clientRes.write(`data: ${JSON.stringify(notification)}\n\n`);
      } catch (sseErr) {
        // Client disconnected between check and write — remove stale entry
        sseClients.delete(recipient.toString());
      }
    }

    return notification;
  } catch (err) {
    console.error('[NotificationService] Failed to create notification:', err.message);
    // Return null instead of throwing so callers are never blocked
    return null;
  }
};

module.exports = { createNotification };
