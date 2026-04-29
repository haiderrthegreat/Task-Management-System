"use strict";

const fs = require("fs");
const path = require("path");
const { prisma } = require("../config/db");
const { UPLOADS_DIR } = require("../middlewares/upload.middleware");

const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const requireWorkspaceMember = async (workspaceId, userId) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!membership) {
    throw createError("You are not a member of this workspace", 403);
  }
  return membership;
};

const getActiveTask = async (taskId, workspaceId) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId, deletedAt: null },
  });
  if (!task) throw createError("Task not found", 404);
  return task;
};

// ─── Upload Attachment ────────────────────────────────────────────────────────

const uploadAttachment = async ({ taskId, workspaceId, userId, file }) => {
  await requireWorkspaceMember(workspaceId, userId);
  await getActiveTask(taskId, workspaceId);

  const attachment = await prisma.attachment.create({
    data: {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      taskId,
      uploadedById: userId,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return attachment;
};

// ─── Get Attachments ──────────────────────────────────────────────────────────

const getAttachments = async ({ taskId, workspaceId, userId }) => {
  await requireWorkspaceMember(workspaceId, userId);
  await getActiveTask(taskId, workspaceId);

  return prisma.attachment.findMany({
    where: { taskId },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Download Attachment ──────────────────────────────────────────────────────

const getAttachmentForDownload = async ({ attachmentId, taskId, workspaceId, userId }) => {
  await requireWorkspaceMember(workspaceId, userId);

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment || attachment.taskId !== taskId) {
    throw createError("Attachment not found", 404);
  }

  // Check file still exists on disk
  if (!fs.existsSync(attachment.path)) {
    throw createError("File not found on server", 404);
  }

  return attachment;
};

// ─── Delete Attachment ────────────────────────────────────────────────────────

const deleteAttachment = async ({ attachmentId, taskId, workspaceId, userId }) => {
  const membership = await requireWorkspaceMember(workspaceId, userId);

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment || attachment.taskId !== taskId) {
    throw createError("Attachment not found", 404);
  }

  // Only uploader or OWNER can delete
  if (attachment.uploadedById !== userId && membership.role !== "OWNER") {
    throw createError("You do not have permission to delete this attachment", 403);
  }

  // Delete from disk
  if (fs.existsSync(attachment.path)) {
    fs.unlinkSync(attachment.path);
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });
};

module.exports = {
  uploadAttachment,
  getAttachments,
  getAttachmentForDownload,
  deleteAttachment,
};