"use strict";

require("./config/env");

const http = require("http");
const app = require("./app");
const { connectDB, disconnectDB } = require("./config/db");
const { initSocket } = require("./config/socket");
const env = require("./config/env");

const startServer = async () => {
  try {
    await connectDB();

    // Create HTTP server from Express app
    const server = http.createServer(app);

    // Initialize Socket.io with the HTTP server
    initSocket(server);

    server.listen(env.port, () => {
      console.log(`🚀 Server is running on port ${env.port}`);
      console.log(`🔌 Socket.io initialized`);
    });

    // ─── Graceful Shutdown ──────────────────────────────────────────────────
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log("✅ Server closed cleanly.");
        process.exit(0);
      });

      setTimeout(() => {
        console.error("❌ Forceful shutdown after timeout.");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      console.error("❌ Unhandled Rejection:", reason);
      process.exit(1);
    });

    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();