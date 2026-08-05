import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import dotenv from "dotenv";
import { pubClient, subClient, isRedisEnabled } from "./redis/redis-client";
import { authMiddleware, AuthenticatedSocket } from "./middleware/auth.middleware";
import { registerChatHandlers } from "./events/chat.events";

dotenv.config();

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const app = express();

// Health check endpoint (for Railway deployment)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

async function startServer() {
  try {
    if (isRedisEnabled) {
      try {
        await Promise.all([
          new Promise<void>((resolve, reject) =>
            pubClient.once("ready", resolve).once("error", reject)
          ),
          new Promise<void>((resolve, reject) =>
            subClient.once("ready", resolve).once("error", reject)
          ),
        ]);

        io.adapter(createAdapter(pubClient, subClient));
        console.log("✅ Redis adapter connected");
      } catch (err) {
        console.error("❌ Redis connection failed:", err);
        process.exit(1);
      }
    } else {
      console.log("ℹ️ Running in memory-only mode (No Redis Adapter)");
    }

    // ── Authentication middleware ───────────────────────────────────────────────
    io.use((socket, next) =>
      authMiddleware(socket as AuthenticatedSocket, next)
    );

    // ── Register socket event handlers per connection ─────────────────────────
    io.on("connection", (socket) => {
      console.log(`[WS] Client connected: ${(socket as AuthenticatedSocket).data.userName}`);
      registerChatHandlers(io, socket as AuthenticatedSocket);
    });

    httpServer.listen(PORT, () => {
      console.log(`🚀 Socket.io server running on port ${PORT}`);
      console.log(`   CORS allowed from: ${FRONTEND_URL}`);
    });
  } catch (error) {
    console.error("FATAL ERROR IN startServer:", error);
  }
}

startServer();
