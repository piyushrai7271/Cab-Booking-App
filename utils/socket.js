const { Server } = require("socket.io");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // or your frontend domain
      methods: ["GET", "POST"],
    },
  });

  // ✅ Keep track of connected users/drivers by socket ID
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    // ✅ Handle joining (could be user or driver)
    socket.on("join", ({ userId, userType }) => {
      if (!userId || !userType) return;
      onlineUsers.set(userId, socket.id);
      console.log(`${userType} (${userId}) joined with socket ${socket.id}`);
    });

    // ✅ Handle sending message
    socket.on("send_message", (data) => {
      const { senderId, receiverId, message } = data;

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", {
          senderId,
          message,
          timestamp: new Date(),
        });
      }
    });

    // ✅ Handle disconnection
    socket.on("disconnect", () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });
};

module.exports = initSocket;
