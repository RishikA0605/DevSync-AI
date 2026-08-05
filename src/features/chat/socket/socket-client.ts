import { io, Socket } from "socket.io-client";

// The URL of the standalone Socket.io server
// In local dev: http://localhost:3001
// In production: Your Railway deployment URL
const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

// Returns a singleton socket instance
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      autoConnect: false,         // We connect manually after auth is confirmed
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket"],  // Prefer websocket over long-polling
    });
  }
  return socket;
}

export function connectSocket(token: string) {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
}
