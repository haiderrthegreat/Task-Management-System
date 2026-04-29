"use strict";

const path = require("path");
const attachmentService = require("../services/attachment.service");
const { sendSuccess } = require("../utils/response");

/**
 * POST /api/workspaces/:workspaceId/tasks/:taskId/attachments
 */
const uploadAttachment = async (req, res, next) => {
  try {
    const { workspaceId, taskId } = req.params;
    const userId = req.user.sub;

    if (!req.file) {
      return next(Object.assign(new Error("No file uploaded"), { statusCode: 400 }));
    }

    const attachment = await attachmentService.uploadAttachment({
      taskId, workspaceId, userId, file: req.file,
    });

    return sendSuccess(res, 201, "File uploaded successfully", attachment);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workspaces/:workspaceId/tasks/:taskId/attachments
 */
const getAttachments = async (req, res, next) => {
  try {
    const { workspaceId, taskId } = req.params;
    const userId = req.user.sub;

    const attachments = await attachmentService.getAttachments({
      taskId, workspaceId, userId,
    });

    return sendSuccess(res, 200, "Attachments fetched successfully", attachments);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workspaces/:workspaceId/tasks/:taskId/attachments/:attachmentId/download
 * Authenticated file download — does NOT expose static folder
 */
const downloadAttachment = async (req, res, next) => {
  try {
    const { workspaceId, taskId, attachmentId } = req.params;
    const userId = req.user.sub;

    const attachment = await attachmentService.getAttachmentForDownload({
      attachmentId, taskId, workspaceId, userId,
    });

    // Set headers for file download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${attachment.originalName}"`
    );
    res.setHeader("Content-Type", attachment.mimeType);

    // Stream file to response — never expose the raw path to client
    res.sendFile(path.resolve(attachment.path));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/workspaces/:workspaceId/tasks/:taskId/attachments/:attachmentId
 */
const deleteAttachment = async (req, res, next) => {
  try {
    const { workspaceId, taskId, attachmentId } = req.params;
    const userId = req.user.sub;

    await attachmentService.deleteAttachment({
      attachmentId, taskId, workspaceId, userId,
    });

    return sendSuccess(res, 200, "Attachment deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAttachment,
  getAttachments,
  downloadAttachment,
  deleteAttachment,
};