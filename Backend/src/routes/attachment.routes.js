"use strict";

const { Router } = require("express");
const attachmentController = require("../controllers/attachment.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { upload, handleUploadError } = require("../middlewares/upload.middleware");

const router = Router({ mergeParams: true });

router.use(authenticate);

// POST   /api/workspaces/:workspaceId/tasks/:taskId/attachments
// "file" is the form-data field name
router.post(
  "/",
  upload.single("file"),
  handleUploadError,
  attachmentController.uploadAttachment
);

// GET    /api/workspaces/:workspaceId/tasks/:taskId/attachments
router.get("/", attachmentController.getAttachments);

// GET    /api/workspaces/:workspaceId/tasks/:taskId/attachments/:attachmentId/download
router.get("/:attachmentId/download", attachmentController.downloadAttachment);

// DELETE /api/workspaces/:workspaceId/tasks/:taskId/attachments/:attachmentId
router.delete("/:attachmentId", attachmentController.deleteAttachment);

module.exports = router;