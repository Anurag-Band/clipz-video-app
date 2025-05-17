import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

// Store active connections
const rooms: Record<string, string[]> = {};

/**
 * Initialize Socket.IO server
 * @param httpServer HTTP server instance
 * @returns Socket.IO server instance
 */
export function initializeSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Join a room
    socket.on("join-room", (roomId: string, userId: string) => {
      console.log(`User ${userId} joining room ${roomId}`);

      // Add user to room
      if (!rooms[roomId]) {
        rooms[roomId] = [];
        console.log(`New room created: ${roomId}`);
      }
      rooms[roomId].push(socket.id);

      // Join the room
      socket.join(roomId);

      // Notify others in the room
      socket.to(roomId).emit("user-joined", userId);

      // Send list of users in the room
      io.to(roomId).emit("room-users", rooms[roomId]);

      console.log(`Room ${roomId} now has ${rooms[roomId].length} users`);
    });

    // Handle WebRTC signaling
    socket.on("signal", (roomId: string, userId: string, signal: any) => {
      console.log(`Signal from ${userId} in room ${roomId}`);
      socket.to(roomId).emit("signal", userId, signal);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      // Remove user from all rooms
      for (const roomId in rooms) {
        const index = rooms[roomId].indexOf(socket.id);
        if (index !== -1) {
          rooms[roomId].splice(index, 1);

          // Notify others in the room
          socket.to(roomId).emit("user-left", socket.id);

          // If room is empty, delete it
          if (rooms[roomId].length === 0) {
            delete rooms[roomId];
          }
        }
      }
    });
  });

  return io;
}

