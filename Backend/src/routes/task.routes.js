"use strict";

const { Router } = require("express");
const taskController = require("../controllers/task.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { validate, validateQuery } = require("../middlewares/validate.middleware");
const {
  createTaskSchema,
  updateTaskSchema,
  listTasksSchema,
  assignUserSchema,
  removeAssigneeSchema,
} = require("../validators/task.validator");

// mergeParams: true is REQUIRED — lets us access :workspaceId from parent router
const router = Router({ mergeParams: true });

// All task routes require authentication
router.use(authenticate);

// ─── Task CRUD ────────────────────────────────────────────────────────────────

// POST   /api/workspaces/:workspaceId/tasks
router.post("/", validate(createTaskSchema), taskController.createTask);

// GET    /api/workspaces/:workspaceId/tasks
router.get("/", validateQuery(listTasksSchema), taskController.getAllTasks);

// GET    /api/workspaces/:workspaceId/tasks/:taskId
router.get("/:taskId", taskController.getTaskById);

// PATCH  /api/workspaces/:workspaceId/tasks/:taskId
router.patch("/:taskId", validate(updateTaskSchema), taskController.updateTask);

// DELETE /api/workspaces/:workspaceId/tasks/:taskId
router.delete("/:taskId", taskController.deleteTask);

// ─── Assignees ────────────────────────────────────────────────────────────────

// POST   /api/workspaces/:workspaceId/tasks/:taskId/assignees
router.post(
  "/:taskId/assignees",
  validate(assignUserSchema),
  taskController.assignUser
);

// DELETE /api/workspaces/:workspaceId/tasks/:taskId/assignees
router.delete(
  "/:taskId/assignees",
  validate(removeAssigneeSchema),
  taskController.removeAssignee
);

module.exports = router;