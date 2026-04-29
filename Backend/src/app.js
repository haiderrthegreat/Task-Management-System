"use strict";

const express = require("express");
const swaggerDocument = require("./docs/openapi.json");
const { notFound, globalErrorHandler } = require("./middlewares/error.middleware");
const authRoutes = require("./routes/auth.routes");
const workspaceRoutes = require("./routes/workspace.routes");
const taskRoutes = require("./routes/task.routes");

const commentRoutes = require("./routes/comment.routes");
const attachmentRoutes = require("./routes/attachment.routes");


const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/openapi.json", (_req, res) => {
  res.json(swaggerDocument);
});

app.get("/api-docs", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TaskFlow API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html { box-sizing: border-box; overflow-y: scroll; }
      *, *:before, *:after { box-sizing: inherit; }
      body { margin: 0; background: #fafafa; }
      .swagger-ui .topbar { display: none; }
      .swagger-ui { background: #fafafa; }
      .swagger-ui .scheme-container { background: #fff; border: 1px solid #e0e0e0; }
      .swagger-ui .model-toggle:after { background: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27%3E%3Cpath d=%27M10 17.414l6.707-6.707-1.414-1.414L10 14.586l-5.293-5.293-1.414 1.414z%27/%3E%3C/svg%3E") 50% no-repeat; background-size: 24px; }
      .swagger-ui .btn { color: #fff; border: 2px solid #4F46E5; background: #4F46E5; }
      .swagger-ui .btn:hover { background: #4338ca; border-color: #4338ca; }
      .swagger-ui .model { background: #f5f5f5; border: 1px solid #ddd; }
      .swagger-ui table { background: #fff; }
      .swagger-ui table tbody tr { border-bottom: 1px solid #eee; }
      .swagger-ui .operation { border: 1px solid #e0e0e0; margin: 10px 0; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function () {
        SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'BaseLayout',
          theme: 'light'
        });
      };
    </script>
  </body>
</html>`);
});

// Mailtrap invite link entrypoint. Redirects to API invite acceptance endpoint.
app.get("/invite", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Invitation token is required",
    });
  }

  return res.redirect(302, `/api/workspaces/accept-invite?token=${encodeURIComponent(token)}`);
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces/:workspaceId/tasks", taskRoutes);
app.use("/api/workspaces/:workspaceId/tasks/:taskId/comments", commentRoutes);
app.use("/api/workspaces/:workspaceId/tasks/:taskId/attachments", attachmentRoutes);

app.use(notFound);
app.use(globalErrorHandler);

module.exports = app;