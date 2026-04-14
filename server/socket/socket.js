const jwt = require("jsonwebtoken");
const User = require("../models/User");

const connectedUsers = new Map(); // userId -> socketId

const initSocket = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select("-password");
      if (!socket.user) return next(new Error("User not found"));
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    connectedUsers.set(userId, socket.id);

    // Notify contacts that user is online
    socket.broadcast.emit("user:online", { userId });

    // Join a conversation room
    socket.on("conversation:join", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // New message event (for real-time delivery)
    socket.on("message:send", (data) => {
      const { conversationId, message } = data;
      // Broadcast to everyone in the conversation room (including sender on other tabs)
      socket.to(`conversation:${conversationId}`).emit("message:receive", {
        conversationId,
        message,
      });
    });

    // Typing indicators
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:start", {
        userId,
        name: socket.user.name,
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:stop", { userId });
    });

    // Offer events
    socket.on("offer:send", (data) => {
      const { conversationId, offer } = data;
      socket.to(`conversation:${conversationId}`).emit("offer:receive", offer);
    });

    socket.on("disconnect", () => {
      connectedUsers.delete(userId);
      socket.broadcast.emit("user:offline", { userId });
    });
  });
};

// Helper to check if a user is online
const isUserOnline = (userId) => connectedUsers.has(userId.toString());

module.exports = initSocket;
module.exports.isUserOnline = isUserOnline;
