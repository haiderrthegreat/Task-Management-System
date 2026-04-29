"use strict";

const { prisma } = require("../config/db");
const { emitToWorkspace } = require("../config/socket");

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

// ─── Create Comment ───────────────────────────────────────────────────────────

const createComment = async ({ taskId, workspaceId, userId, content }) => {
  await requireWorkspaceMember(workspaceId, userId);
  await getActiveTask(taskId, workspaceId);

  const comment = await prisma.comment.create({
    data: { content, taskId, userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Emit real-time event to workspace room
  emitToWorkspace(workspaceId, "comment.created", {
    taskId,
    comment,
  });

  return comment;
};

// ─── Get All Comments ─────────────────────────────────────────────────────────

const getComments = async ({ taskId, workspaceId, userId }) => {
  await requireWorkspaceMember(workspaceId, userId);
  await getActiveTask(taskId, workspaceId);

  return prisma.comment.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
};

// ─── Update Comment ───────────────────────────────────────────────────────────

const updateComment = async ({ commentId, taskId, workspaceId, userId, content }) => {
  await requireWorkspaceMember(workspaceId, userId);

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment || comment.taskId !== taskId) {
    throw createError("Comment not found", 404);
  }

  // Only comment author can update
  if (comment.userId !== userId) {
    throw createError("You can only edit your own comments", 403);
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return updated;
};

// ─── Delete Comment ───────────────────────────────────────────────────────────

const deleteComment = async ({ commentId, taskId, workspaceId, userId }) => {
  const membership = await requireWorkspaceMember(workspaceId, userId);

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment || comment.taskId !== taskId) {
    throw createError("Comment not found", 404);
  }

  // Author or workspace OWNER can delete
  if (comment.userId !== userId && membership.role !== "OWNER") {
    throw createError("You do not have permission to delete this comment", 403);
  }

  await prisma.comment.delete({ where: { id: commentId } });
};

module.exports = { createComment, getComments, updateComment, deleteComment };