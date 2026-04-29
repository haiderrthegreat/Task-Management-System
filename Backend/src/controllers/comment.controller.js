"use strict";

const commentService = require("../services/comment.service");
const { sendSuccess } = require("../utils/response");

/**
 * POST /api/workspaces/:workspaceId/tasks/:taskId/comments
 */
const createComment = async (req, res, next) => {
  try {
    const { workspaceId, taskId } = req.params;
    const userId = req.user.sub;
    const { content } = req.validatedData;

    const comment = await commentService.createComment({
      taskId, workspaceId, userId, content,
    });

    return sendSuccess(res, 201, "Comment created successfully", comment);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workspaces/:workspaceId/tasks/:taskId/comments
 */
const getComments = async (req, res, next) => {
  try {
    const { workspaceId, taskId } = req.params;
    const userId = req.user.sub;

    const comments = await commentService.getComments({
      taskId, workspaceId, userId,
    });

    return sendSuccess(res, 200, "Comments fetched successfully", comments);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/workspaces/:workspaceId/tasks/:taskId/comments/:commentId
 */
const updateComment = async (req, res, next) => {
  try {
    const { workspaceId, taskId, commentId } = req.params;
    const userId = req.user.sub;
    const { content } = req.validatedData;

    const comment = await commentService.updateComment({
      commentId, taskId, workspaceId, userId, content,
    });

    return sendSuccess(res, 200, "Comment updated successfully", comment);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/workspaces/:workspaceId/tasks/:taskId/comments/:commentId
 */
const deleteComment = async (req, res, next) => {
  try {
    const { workspaceId, taskId, commentId } = req.params;
    const userId = req.user.sub;

    await commentService.deleteComment({
      commentId, taskId, workspaceId, userId,
    });

    return sendSuccess(res, 200, "Comment deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { createComment, getComments, updateComment, deleteComment };