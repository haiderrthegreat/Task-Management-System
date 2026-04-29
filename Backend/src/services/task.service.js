"use strict";

const { prisma } = require("../config/db");
const { emitToWorkspace } = require("../config/socket");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Verify user is a member of the workspace
 */
const requireWorkspaceMember = async (workspaceId, userId) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!membership) {
    throw createError("You are not a member of this workspace", 403);
  }
  return membership;
};

/**
 * Get active (non-deleted) task by ID
 */
const getActiveTask = async (taskId) => {
  return prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  });
};

// ─── Create Task ──────────────────────────────────────────────────────────────

const createTask = async ({ workspaceId, userId, data }) => {
  await requireWorkspaceMember(workspaceId, userId);

  const { title, description, status, priority, dueDate, assigneeIds } = data;

  // Validate assignees are workspace members
  if (assigneeIds && assigneeIds.length > 0) {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId, userId: { in: assigneeIds } },
    });
    if (members.length !== assigneeIds.length) {
      throw createError(
        "One or more assignees are not members of this workspace",
        400
      );
    }
  }

  const task = await prisma.$transaction(async (tx) => {
    const newTask = await tx.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        workspaceId,
        createdById: userId,
      },
    });

    if (assigneeIds && assigneeIds.length > 0) {
      await tx.taskAssignee.createMany({
        data: assigneeIds.map((uid) => ({
          taskId: newTask.id,
          userId: uid,
        })),
      });
    }

    return newTask;
  });

  const taskWithAssignees = await getTaskWithAssignees(task.id);

  // Emit real-time event
  emitToWorkspace(workspaceId, "task.created", taskWithAssignees);

  return taskWithAssignees;
};

// ─── Get All Tasks ────────────────────────────────────────────────────────────

const getAllTasks = async ({ workspaceId, userId, filters }) => {
  await requireWorkspaceMember(workspaceId, userId);

  const {
    status,
    priority,
    assigneeId,
    search,
    cursor,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const where = {
    workspaceId,
    deletedAt: null,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(search && {
      title: { contains: search, mode: "insensitive" },
    }),
    ...(assigneeId && {
      assignees: { some: { userId: assigneeId } },
    }),
  };

  const cursorObj = cursor ? { id: cursor } : undefined;

  const orderBy = [];
  if (sortBy === "priority") {
    orderBy.push({ priority: sortOrder });
  } else {
    orderBy.push({ [sortBy]: sortOrder });
  }
  orderBy.push({ id: "asc" });

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursorObj && {
      cursor: cursorObj,
      skip: 1,
    }),
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      assignees: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const hasNextPage = tasks.length > limit;
  const items = hasNextPage ? tasks.slice(0, -1) : tasks;
  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return {
    tasks: items,
    pagination: {
      hasNextPage,
      nextCursor,
      limit,
    },
  };
};

// ─── Get Single Task ──────────────────────────────────────────────────────────

const getTaskById = async ({ taskId, workspaceId, userId }) => {
  await requireWorkspaceMember(workspaceId, userId);

  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId, deletedAt: null },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      assignees: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!task) {
    throw createError("Task not found", 404);
  }

  return task;
};

// ─── Update Task ──────────────────────────────────────────────────────────────

const updateTask = async ({ taskId, workspaceId, userId, data }) => {
  const membership = await requireWorkspaceMember(workspaceId, userId);

  const task = await getActiveTask(taskId);
  if (!task || task.workspaceId !== workspaceId) {
    throw createError("Task not found", 404);
  }

  if (membership.role !== "OWNER" && task.createdById !== userId) {
    throw createError("You do not have permission to update this task", 403);
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignees: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  // Emit real-time event
  emitToWorkspace(workspaceId, "task.updated", updated);

  return updated;
};

// ─── Delete Task (Soft Delete) ────────────────────────────────────────────────

const deleteTask = async ({ taskId, workspaceId, userId }) => {
  const membership = await requireWorkspaceMember(workspaceId, userId);

  const task = await getActiveTask(taskId);
  if (!task || task.workspaceId !== workspaceId) {
    throw createError("Task not found", 404);
  }

  if (membership.role !== "OWNER" && task.createdById !== userId) {
    throw createError("You do not have permission to delete this task", 403);
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
  });

  // Emit real-time event
  emitToWorkspace(workspaceId, "task.deleted", { taskId });
};

// ─── Assign User ──────────────────────────────────────────────────────────────

const assignUser = async ({ taskId, workspaceId, requesterId, targetUserId }) => {
  const membership = await requireWorkspaceMember(workspaceId, requesterId);

  if (membership.role !== "OWNER") {
    throw createError("Only workspace owner can assign users to tasks", 403);
  }

  const task = await getActiveTask(taskId);
  if (!task || task.workspaceId !== workspaceId) {
    throw createError("Task not found", 404);
  }

  const targetMembership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });
  if (!targetMembership) {
    throw createError("User is not a member of this workspace", 400);
  }

  const existing = await prisma.taskAssignee.findUnique({
    where: { taskId_userId: { taskId, userId: targetUserId } },
  });
  if (existing) {
    throw createError("User is already assigned to this task", 409);
  }

  const assignee = await prisma.taskAssignee.create({
    data: { taskId, userId: targetUserId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return assignee;
};

// ─── Remove Assignee ──────────────────────────────────────────────────────────

const removeAssignee = async ({ taskId, workspaceId, requesterId, targetUserId }) => {
  const membership = await requireWorkspaceMember(workspaceId, requesterId);

  if (membership.role !== "OWNER") {
    throw createError("Only workspace owner can remove assignees", 403);
  }

  const task = await getActiveTask(taskId);
  if (!task || task.workspaceId !== workspaceId) {
    throw createError("Task not found", 404);
  }

  const existing = await prisma.taskAssignee.findUnique({
    where: { taskId_userId: { taskId, userId: targetUserId } },
  });
  if (!existing) {
    throw createError("User is not assigned to this task", 404);
  }

  await prisma.taskAssignee.delete({
    where: { taskId_userId: { taskId, userId: targetUserId } },
  });
};

// ─── Internal Helper ──────────────────────────────────────────────────────────

const getTaskWithAssignees = async (taskId) => {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignees: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
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