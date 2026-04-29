"use strict";

const express = require("express");
const { notFound, globalErrorHandler } = require("./middlewares/error.middleware");
const authRoutes = require("./routes/auth.routes");

const app = express();

// ─── Core Middlewares ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

module.exports = app;