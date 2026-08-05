import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface AuthPayload {
  userId: string;
  name: string;
  image: string | null;
  workspaceId?: string;
}

// Extend Socket type to include our auth data
export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    userName: string;
    userImage: string | null;
    workspaceId?: string;
  };
}

// WebSocket-layer authentication middleware
// Validates the session token passed during socket handshake
export function authMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET not configured");

    // NextAuth v5 JWTs are signed with AUTH_SECRET
    const decoded = jwt.verify(token, secret) as AuthPayload;

    socket.data.userId = decoded.userId;
    socket.data.userName = decoded.name;
    socket.data.userImage = decoded.image;

    return next();
  } catch (err) {
    console.error("[WS Auth] Invalid token:", err);
    return next(new Error("Authentication error: Invalid token"));
  }
}
