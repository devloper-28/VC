const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Configure CORS for frontend
const io = socketIo(server, {
  cors: {
    origin: true, // Allow all origins for mobile testing
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: true, // Allow all origins for mobile testing
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'Server is running', port: PORT, timestamp: new Date().toISOString() });
});

// Additional health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested at /health');
  res.json({ status: 'OK', port: PORT, timestamp: new Date().toISOString() });
});

// Store waiting users and active rooms
const waitingUsers = new Map(); // socketId -> user data
const activeRooms = new Map(); // roomId -> { user1, user2, messages }

// User matching queue
const matchingQueue = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User wants to start chatting
  socket.on('start-chat', (userData) => {
    console.log('User wants to start chat:', userData);
    
    // Add user to waiting list
    waitingUsers.set(socket.id, {
      socketId: socket.id,
      ...userData,
      joinedAt: Date.now()
    });

    // Add user to matching queue
    matchingQueue.push(socket.id);
    console.log('Added to queue. Queue length:', matchingQueue.length);

    // Try to match with another user
    matchUsers();
  });

  // User wants to stop searching
  socket.on('stop-search', () => {
    console.log('User stopped searching:', socket.id);
    waitingUsers.delete(socket.id);
    removeFromQueue(socket.id);
    socket.emit('search-stopped');
  });

  // User wants to disconnect from current chat
  socket.on('disconnect-chat', () => {
    const room = findRoomBySocketId(socket.id);
    if (room) {
      const otherUser = room.user1.socketId === socket.id ? room.user2 : room.user1;
      
      // Notify other user
      io.to(otherUser.socketId).emit('stranger-disconnected');
      
      // Remove room
      activeRooms.delete(room.roomId);
      
      // Add other user back to queue
      if (otherUser.socketId) {
        waitingUsers.set(otherUser.socketId, otherUser);
        matchingQueue.push(otherUser.socketId);
      }
    }
    
    socket.emit('chat-disconnected');
  });

  // User wants to find new stranger
  socket.on('find-new-stranger', () => {
    const room = findRoomBySocketId(socket.id);
    if (room) {
      // Disconnect from current chat
      const otherUser = room.user1.socketId === socket.id ? room.user2 : room.user1;
      io.to(otherUser.socketId).emit('stranger-disconnected');
      activeRooms.delete(room.roomId);
    }

    // Add back to queue
    const userData = waitingUsers.get(socket.id) || { socketId: socket.id };
    waitingUsers.set(socket.id, userData);
    matchingQueue.push(socket.id);
    
    socket.emit('searching-for-stranger');
    matchUsers();
  });

  // WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    console.log('Received WebRTC offer from:', socket.id);
    const room = findRoomBySocketId(socket.id);
    if (room) {
      const otherUser = room.user1.socketId === socket.id ? room.user2 : room.user1;
      console.log('Forwarding offer to:', otherUser.socketId);
      io.to(otherUser.socketId).emit('webrtc-offer', data);
    } else {
      console.log('No room found for socket:', socket.id);
    }
  });

  socket.on('webrtc-answer', (data) => {
    console.log('Received WebRTC answer from:', socket.id);
    const room = findRoomBySocketId(socket.id);
    if (room) {
      const otherUser = room.user1.socketId === socket.id ? room.user2 : room.user1;
      console.log('Forwarding answer to:', otherUser.socketId);
      io.to(otherUser.socketId).emit('webrtc-answer', data);
    } else {
      console.log('No room found for socket:', socket.id);
    }
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const room = findRoomBySocketId(socket.id);
    if (room) {
      const otherUser = room.user1.socketId === socket.id ? room.user2 : room.user1;
      io.to(otherUser.socketId).emit('webrtc-ice-candidate', data);
    }
  });

  // Chat messages
  socket.on('send-message', (message) => {
    const room = findRoomBySocketId(socket.id);
    if (room) {
      const messageData = {
        id: uuidv4(),
        text: message,
        sender: socket.id,
        timestamp: Date.now()
      };
      
      room.messages.push(messageData);
      
      // Send to both users
      io.to(room.user1.socketId).emit('new-message', messageData);
      io.to(room.user2.socketId).emit('new-message', messageData);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from waiting users
    waitingUsers.delete(socket.id);
    removeFromQueue(socket.id);
    
    // Handle room cleanup
    const room = findRoomBySocketId(socket.id);
    if (room) {
      const otherUser = room.user1.socketId === socket.id ? room.user2 : room.user1;
      if (otherUser.socketId) {
        io.to(otherUser.socketId).emit('stranger-disconnected');
      }
      activeRooms.delete(room.roomId);
    }
  });
});

function matchUsers() {
  console.log('Trying to match users. Queue length:', matchingQueue.length);
  if (matchingQueue.length >= 2) {
    const user1Id = matchingQueue.shift();
    const user2Id = matchingQueue.shift();
    
    console.log('Attempting to match:', user1Id, 'and', user2Id);
    
    const user1 = waitingUsers.get(user1Id);
    const user2 = waitingUsers.get(user2Id);
    
    if (user1 && user2) {
      // Create room
      const roomId = uuidv4();
      const room = {
        roomId,
        user1,
        user2,
        messages: [],
        createdAt: Date.now()
      };
      
      activeRooms.set(roomId, room);
      
      // Remove from waiting users
      waitingUsers.delete(user1Id);
      waitingUsers.delete(user2Id);
      
      // Notify both users
      io.to(user1Id).emit('stranger-found', {
        roomId,
        stranger: user2
      });
      
      io.to(user2Id).emit('stranger-found', {
        roomId,
        stranger: user1
      });
      
      console.log(`Matched users: ${user1Id} and ${user2Id} in room ${roomId}`);
    }
  }
}

function removeFromQueue(socketId) {
  const index = matchingQueue.indexOf(socketId);
  if (index > -1) {
    matchingQueue.splice(index, 1);
  }
}

function findRoomBySocketId(socketId) {
  for (const room of activeRooms.values()) {
    if (room.user1.socketId === socketId || room.user2.socketId === socketId) {
      return room;
    }
  }
  return null;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
