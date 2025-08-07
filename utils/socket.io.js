const socketio = require('socket.io');
const messageModel = require('../models/ChatModel/messages.model');
const ticketModel = require('../models/AdminModels/ticket.model');
 
 
let io;
 
const initializeSocket = (server) => {
  io = socketio(server, {
    cors: {
      origin: ["http://localhost:5173"],
      methods: ["GET", "POST"],
      
    }
  });
 
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
 
    // Join user/driver specific room
    socket.on('joinChat', async (data) => {
      try {
        const { userId, userType } = data;
        
        if (!userId || !userType || !['User', 'Driver'].includes(userType)) {
          return socket.emit('error', { message: 'Invalid user data' });
        }
 
        const roomName = `${userType}_${userId}`;
        socket.join(roomName);
        console.log(`${userType} ${userId} joined chat room`);
 
        // Mark messages as read
        await messageModel.updateMany(
          { 
            receiver: userId, 
            receiverModel: userType,
            read: false 
          },
          { $set: { read: true } }
        );
 
        socket.emit('joinedChat', { success: true });
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });
 
    // Handle message sending
    socket.on('sendMessage', async (data) => {
      try {
        const { senderId, senderType, receiverId, receiverType, content } = data;
        
        // Validate input
        if (!senderId || !senderType || !receiverId || !receiverType || !content) {
          return socket.emit('error', { message: 'Missing required fields' });
        }
 
        if (!['User', 'Driver'].includes(senderType) || !['User', 'Driver'].includes(receiverType)) {
          return socket.emit('error', { message: 'Invalid user types' });
        }
 
        // Create and save message
        const newMessage = new Message({
          sender: senderId,
          senderModel: senderType,
          receiver: receiverId,
          receiverModel: receiverType,
          content,
          read: false
        });
        
        const savedMessage = await newMessage.save();
        
        // Emit to sender
        const senderRoom = `${senderType}_${senderId}`;
        io.to(senderRoom).emit('newMessage', savedMessage);
        
        // Emit to receiver
        const receiverRoom = `${receiverType}_${receiverId}`;
        io.to(receiverRoom).emit('newMessage', savedMessage);
        
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
 
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
 
  return io;
};
 
module.exports = { initializeSocket, getIO: () => io };