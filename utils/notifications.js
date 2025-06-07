const Notification = require('../models/Notification');

/**
 * Send a notification to a user
 * @param {Object} options - Notification options
 * @param {String} options.recipientId - ID of the user receiving the notification
 * @param {String} options.senderId - ID of the user sending the notification
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} [options.reportId] - Optional related report ID
 * @returns {Promise<Object>} The created notification
 */
const sendNotification = async ({
  recipientId,
  senderId,
  title,
  message,
  reportId
}) => {
  try {
    const notification = new Notification({
      title,
      message,
      recipient: recipientId,
      sender: senderId,
      reportId,
      read: false
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Send a notification when a report status is updated
 * @param {Object} options - Notification options
 * @param {String} options.reportId - ID of the report
 * @param {String} options.reporterId - ID of the reporter
 * @param {String} options.status - New status
 * @param {String} options.updatedById - ID of the user who updated the status
 * @returns {Promise<Object>} The created notification
 */
const sendStatusUpdateNotification = async ({
  reportId,
  reporterId,
  status,
  updatedById
}) => {
  const statusMessages = {
    pending: 'Your report is pending review',
    in_progress: 'Your report is now being processed',
    resolved: 'Your report has been resolved',
    rejected: 'Your report has been rejected'
  };

  return sendNotification({
    recipientId: reporterId,
    senderId: updatedById,
    title: `Report Status Updated: ${status.replace('_', ' ').toUpperCase()}`,
    message: statusMessages[status] || `Your report status has been updated to: ${status}`,
    reportId
  });
};

/**
 * Send a notification when a comment is added to a report
 * @param {Object} options - Notification options
 * @param {String} options.reportId - ID of the report
 * @param {String} options.reporterId - ID of the reporter
 * @param {String} options.commenterId - ID of the user who added the comment
 * @param {String} options.commentText - The comment text (first 50 chars)
 * @returns {Promise<Object>} The created notification
 */
const sendCommentNotification = async ({
  reportId,
  reporterId,
  commenterId,
  commentText
}) => {
  const truncatedComment = commentText.length > 50 
    ? `${commentText.substring(0, 50)}...` 
    : commentText;

  return sendNotification({
    recipientId: reporterId,
    senderId: commenterId,
    title: 'New Comment on Your Report',
    message: `New comment: "${truncatedComment}"`,
    reportId
  });
};

module.exports = {
  sendNotification,
  sendStatusUpdateNotification,
  sendCommentNotification
};
