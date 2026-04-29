"use strict";

const { Router } = require("express");
const commentController = require("../controllers/comment.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const { createCommentSchema, updateCommentSchema } = require("../validators/comment.validator");

const router = Router({ mergeParams: true });

router.use(authenticate);

// POST   /api/workspaces/:workspaceId/tasks/:taskId/comments
router.post("/", validate(createCommentSchema), commentController.createComment);

// GET    /api/workspaces/:workspaceId/tasks/:taskId/comments
router.get("/", commentController.getComments);

// PATCH  /api/workspaces/:workspaceId/tasks/:taskId/comments/:commentId
router.patch("/:commentId", validate(updateCommentSchema), commentController.updateComment);

// DELETE /api/workspaces/:workspaceId/tasks/:taskId/comments/:commentId
router.delete("/:commentId", commentController.deleteComment);

module.exports = router;