"use strict";

const { Server } = require("socket.io");
const { verifyAccessToken } = require("../utils/jwt");
const { prisma } = require("./db");

let io;

/**
 * Initialize Socket.io with the HTTP server
 * @param {import('http').Server} httpServer
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // tighten this in production
      methods: ["GET", "POST"],
    },
  });

  // ─── JWT Auth on every socket connection ────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = verifyAccessToken(token);
      socket.user = decoded; // attach user to socket
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  // ─── Connection handler ─────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.user.sub})`);

    // Join user-specific notification room
    // Allows sending notifications to specific users
    const userRoom = `user:${socket.user.sub}`;
    socket.join(userRoom);
    console.log(`👤 User ${socket.user.sub} joined user room: ${userRoom}`);

    // Join workspace room
    // Client emits: socket.emit("join:workspace", workspaceId)
    socket.on("join:workspace", async (workspaceId) => {
      try {
        // Verify user is actually a member before joining room
        const membership = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId,
              userId: socket.user.sub,
            },
          },
        });

        if (!membership) {
          socket.emit("error", { message: "Access denied to this workspace" });
          return;
        }

        const room = `workspace:${workspaceId}`;
        socket.join(room);
        console.log(`👥 User ${socket.user.sub} joined room: ${room}`);
        socket.emit("joined:workspace", { workspaceId, room });
      } catch (err) {
        socket.emit("error", { message: "Failed to join workspace" });
      }
    });

    // Leave workspace room
    socket.on("leave:workspace", (workspaceId) => {
      const room = `workspace:${workspaceId}`;
      socket.leave(room);
      console.log(`👋 User ${socket.user.sub} left room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get the initialized Socket.io instance
 * Call this in services to emit events
 */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
};

/**
 * Emit event to all members of a workspace room
 * @param {string} workspaceId
 * @param {string} event
 * @param {object} data
 */
const emitToWorkspace = (workspaceId, event, data) => {
  try {
    const ioInstance = getIO();
    ioInstance.to(`workspace:${workspaceId}`).emit(event, data);
  } catch (err) {
    // Don't crash if socket not initialized
    console.error("Socket emit error:", err.message);
  }
};

/**
 * Emit event to a specific user's notification room
 * @param {string} userId
 * @param {string} event
 * @param {object} data
 */
const emitToUser = (userId, event, data) => {
  try {
    const ioInstance = getIO();
    ioInstance.to(`user:${userId}`).emit(event, data);
  } catch (err) {
    // Don't crash if socket not initialized
    console.error("Socket emit error:", err.message);
  }
};

module.exports = { initSocket, getIO, emitToWorkspace, emitToUser };