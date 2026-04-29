"use strict";

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { sendError } = require("../utils/response");

// ─── Allowed file types ───────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const ALLOWED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ─── Ensure uploads folder exists ────────────────────────────────────────────

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ─── Sanitize filename ────────────────────────────────────────────────────────

const sanitizeFilename = (filename) => {
  // Remove path traversal characters and special chars
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")       // no double dots
    .replace(/^\./, "_")           // no leading dot
    .substring(0, 200);            // max length
};

// ─── Multer Storage ───────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitized = sanitizeFilename(
      path.basename(file.originalname, ext)
    );
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sanitized}-${unique}${ext}`);
  },
});

// ─── File Filter — MIME type + extension double check ────────────────────────

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Check MIME type (what the server detects)
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      Object.assign(new Error("File type not allowed"), { statusCode: 400 }),
      false
    );
  }

  // Check extension as second layer
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      Object.assign(new Error("File extension not allowed"), { statusCode: 400 }),
      false
    );
  }

  cb(null, true);
};

// ─── Multer instance ──────────────────────────────────────────────────────────

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ─── Multer error handler middleware ─────────────────────────────────────────

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, 400, "File too large. Maximum size is 5MB");
    }
    return sendError(res, 400, err.message);
  }
  if (err && err.statusCode === 400) {
    return sendError(res, 400, err.message);
  }
  next(err);
};

module.exports = { upload, handleUploadError, UPLOADS_DIR };