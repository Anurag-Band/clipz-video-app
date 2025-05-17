/**
 * Socket.IO client for WebRTC signaling
 */
import { io, Socket } from "socket.io-client";
import { getUserId } from "./auth";

// Socket instance
let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 * @returns Socket.IO client instance
 */
export function initializeSocket(): Socket {
  if (socket) return socket;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  console.log('Connecting to socket server at:', API_URL);

  // Connect to the base URL, not the API endpoint
  socket = io(API_URL);

  socket.on("connect", () => {
    console.log("Connected to signaling server with ID:", socket?.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socket.on("disconnect", (reason) => {
    console.log("Disconnected from signaling server:", reason);
  });

  return socket;
}

/**
 * Join a room
 * @param roomId Room ID to join
 */
export async function joinRoom(roomId: string): Promise<void> {
  const socket = initializeSocket();
  const userId = await getUserId();

  socket.emit("join-room", roomId, userId);
}

/**
 * Leave a room
 * @param roomId Room ID to leave
 */
export async function leaveRoom(roomId: string): Promise<void> {
  const socket = initializeSocket();
  const userId = await getUserId();

  socket.emit("leave-room", roomId, userId);
}

/**
 * Send a WebRTC signal
 * @param roomId Room ID
 * @param signal Signal data
 */
export async function sendSignal(roomId: string, signal: any): Promise<void> {
  const socket = initializeSocket();
  const userId = await getUserId();

  socket.emit("signal", roomId, userId, signal);
}

/**
 * Listen for WebRTC signals
 * @param callback Callback function for received signals
 */
export function onSignal(
  callback: (userId: string, signal: any) => void
): void {
  const socket = initializeSocket();

  socket.on("signal", callback);
}

/**
 * Listen for user joined events
 * @param callback Callback function for user joined events
 */
export function onUserJoined(callback: (userId: string) => void): void {
  const socket = initializeSocket();

  socket.on("user-joined", callback);
}

/**
 * Listen for user left events
 * @param callback Callback function for user left events
 */
export function onUserLeft(callback: (userId: string) => void): void {
  const socket = initializeSocket();

  socket.on("user-left", callback);
}

/**
 * Listen for room users events
 * @param callback Callback function for room users events
 */
export function onRoomUsers(callback: (users: string[]) => void): void {
  const socket = initializeSocket();

  socket.on("room-users", callback);
}
