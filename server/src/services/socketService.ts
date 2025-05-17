import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

// Store room data with user mapping
interface RoomData {
  socketIds: Set<string>;  // Set of socket IDs in the room
  userMap: Map<string, string>;  // Map of userId to socketId
}

// Store active rooms
const rooms: Record<string, RoomData> = {};

// Store which rooms a socket is in
const socketRooms: Map<string, Set<string>> = new Map();

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

    // Initialize socket's room set
    socketRooms.set(socket.id, new Set());

    // Join a room
    socket.on("join-room", (roomId: string, userId: string) => {
      // Create room if it doesn't exist
      if (!rooms[roomId]) {
        rooms[roomId] = {
          socketIds: new Set(),
          userMap: new Map()
        };
        console.log(`New room created: ${roomId}`);
      }

      // Check if this user is already in the room with a different socket
      const existingSocketId = rooms[roomId].userMap.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        console.log(`User ${userId} is already in room ${roomId} with socket ${existingSocketId}`);

        // Remove the old socket from the room
        if (rooms[roomId].socketIds.has(existingSocketId)) {
          rooms[roomId].socketIds.delete(existingSocketId);

          // Update the socket's room set
          const socketRoomSet = socketRooms.get(existingSocketId);
          if (socketRoomSet) {
            socketRoomSet.delete(roomId);
          }

          // Force the old socket to leave the room
          const oldSocket = io.sockets.sockets.get(existingSocketId);
          if (oldSocket) {
            oldSocket.leave(roomId);
          }
        }
      }

      // Check if this socket is already in this room
      if (!rooms[roomId].socketIds.has(socket.id)) {
        // Add socket to room
        rooms[roomId].socketIds.add(socket.id);
        rooms[roomId].userMap.set(userId, socket.id);

        // Add room to socket's room set
        socketRooms.get(socket.id)?.add(roomId);

        // Join the Socket.IO room
        socket.join(roomId);

        // Notify others in the room
        socket.to(roomId).emit("user-joined", userId);

        console.log(`User ${userId} joined room ${roomId}`);
        console.log(`Room ${roomId} now has ${rooms[roomId].socketIds.size} users`);

        // Send list of users in the room
        io.to(roomId).emit("room-users", Array.from(rooms[roomId].userMap.keys()));
      } else {
        console.log(`Socket ${socket.id} is already in room ${roomId}`);
      }
    });

    // Handle WebRTC signaling
    socket.on("signal", (roomId: string, userId: string, signal: any) => {
      console.log(`Signal from ${userId} in room ${roomId}`);
      socket.to(roomId).emit("signal", userId, signal);
    });

    // Leave a room
    socket.on("leave-room", (roomId: string, userId: string) => {
      leaveRoom(socket, roomId, userId, io);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      // Get all rooms this socket was in
      const userRooms = socketRooms.get(socket.id);
      if (userRooms) {
        // Leave each room
        for (const roomId of userRooms) {
          // Find userId for this socket in this room
          let userId: string | undefined;
          const room = rooms[roomId];
          if (room) {
            for (const [uid, sid] of room.userMap.entries()) {
              if (sid === socket.id) {
                userId = uid;
                break;
              }
            }
          }

          // Leave the room
          if (userId) {
            leaveRoom(socket, roomId, userId, io);
          }
        }
      }

      // Clean up socket's room set
      socketRooms.delete(socket.id);
    });
  });

  /**
   * Helper function to handle leaving a room
   */
  function leaveRoom(socket: any, roomId: string, userId: string, io: SocketServer) {
    console.log(`User ${userId} leaving room ${roomId}`);

    // Check if room exists
    if (!rooms[roomId]) {
      console.log(`Room ${roomId} does not exist`);
      return;
    }

    // Check if user is in the room
    if (!rooms[roomId].userMap.has(userId)) {
      console.log(`User ${userId} is not in room ${roomId}`);
      return;
    }

    // Check if this is the correct socket for this user
    const storedSocketId = rooms[roomId].userMap.get(userId);
    if (storedSocketId !== socket.id) {
      console.log(`Socket ${socket.id} is not the socket for user ${userId} in room ${roomId}`);
      return;
    }

    // Remove user from room
    rooms[roomId].userMap.delete(userId);
    rooms[roomId].socketIds.delete(socket.id);

    // Remove room from socket's room set
    socketRooms.get(socket.id)?.delete(roomId);

    // Leave the Socket.IO room
    socket.leave(roomId);

    // Notify others in the room
    socket.to(roomId).emit("user-left", userId);

    // If room is empty, delete it
    if (rooms[roomId].socketIds.size === 0) {
      console.log(`Room ${roomId} is now empty, deleting it`);
      delete rooms[roomId];
    } else {
      console.log(`Room ${roomId} now has ${rooms[roomId].socketIds.size} users`);

      // Send updated list of users in the room
      io.to(roomId).emit("room-users", Array.from(rooms[roomId].userMap.keys()));
    }
  }

  return io;
}

