"use strict";

const taskService = require("../services/task.service");
const { sendSuccess } = require("../utils/response");

/**
 * POST /api/workspaces/:workspaceId/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.sub;

    const task = await taskService.createTask({
      workspaceId,
      userId,
      data: req.validatedData,
    });

    return sendSuccess(res, 201, "Task created successfully", task);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workspaces/:workspaceId/tasks
 */
const getAllTasks = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.sub;

    const result = await taskService.getAllTasks({
      workspaceId,
      userId,
      filters: req.validatedQuery,
    });

    return sendSuccess(res, 200, "Tasks fetched successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workspaces/:workspaceId/tasks/:taskId
 */
const getTaskById = async (req, res, next) => {
  try {
    const { workspaceId, taskId } = req.params;
    const userId = req.user.sub;

    const task = await taskService.getTaskById({ taskId, workspaceId, userId });

    return sendSuccess(res, 200, "Task fetched successfully", task);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/workspaces/:workspaceId/tasks/:taskId
 */
const updateTask = async (req, res, next) => {
  try {
    const { workspaceId, taskId } = req.params;
    const userId = req.user.sub;

    const task = await taskService.updateTask({
      taskId,
      workspaceId,
      userId,
      data: req.validatedData,
    });

    return sendSuccess(res, 200, "Task updated successfully", task);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/workspaces/:workspaceId/tasks/:taskId
 */
const deleteTask = async (req, res, next) => {
  try {
    const { workspaceId, taskId } = req.params;
    const userId = req.user.sub;

    await taskService.deleteTask({ taskId, workspaceId, userId });

    return sendSuccess(res, 200, "Task deleted successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/workspaces/:workspaceId/tasks/:taskId/assignees
 */
const assignUser = async (req, res, next) => {
  try {
    const { workspaceId, taskId } = req.params;
    const requesterId = req.user.sub;
    const { userId: targetUserId } = req.validatedData;

    const assignee = await taskService.assignUser({
      taskId,
      workspaceId,
      requesterId,
      targetUserId,
    });

    return sendSuccess(res, 201, "User assigned to task successfully", assignee);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/workspaces/:workspaceId/tasks/:taskId/assignees
 */
const removeAssignee = async (req, res, next) => {
  try {
    const { workspaceId, taskId } = req.params;
    const requesterId = req.user.sub;
    const { userId: targetUserId } = req.validatedData;

    await taskService.removeAssignee({
      taskId,
      workspaceId,
      requesterId,
      targetUserId,
    });

    return sendSuccess(res, 200, "Assignee removed successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignUser,
  removeAssignee,
};