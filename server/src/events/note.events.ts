import { Server } from "socket.io";
import { AuthenticatedSocket } from "../middleware/auth.middleware";
import * as Y from "yjs";
import dotenv from "dotenv";

dotenv.config();

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
const INTERNAL_SECRET = process.env.INTERNAL_SOCKET_SECRET || "devsync-internal-secret";

async function callInternalApi(endpoint: string, body: any) {
  const res = await fetch(`${FRONTEND_URL}/api/internal/collaboration/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET,
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const errorData: any = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Internal API error: ${res.status}`);
  }
  
  return res.json();
}

// In-memory documents and debounce timers
const documents = new Map<string, Y.Doc>();
const persistenceTimeouts = new Map<string, NodeJS.Timeout>();

export function registerNoteHandlers(io: Server, socket: AuthenticatedSocket) {
  
  socket.on("note:join", async (noteId: string, callback?: (res: any) => void) => {
    try {
      // Very basic authorization check using the Next.js internal API
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
      const authResponse: any = await callInternalApi("auth", { 
        token,
        documentName: `note-${noteId}` 
      }).catch(e => null);
      
      if (!authResponse || !authResponse.authorized) {
        console.warn(`[Notes] Unauthorized join attempt for note-${noteId}`);
        if (callback) callback({ error: "Unauthorized" });
        return;
      }
      
      const roomName = `note:${noteId}`;
      socket.join(roomName);
      console.log(`[Notes] User joined ${roomName}`);
      
      // Load document if not in memory
      let doc = documents.get(noteId);
      if (!doc) {
        doc = new Y.Doc();
        documents.set(noteId, doc);
        
        // Fetch existing binary state from Postgres via Next.js internal API
        const loadRes: any = await callInternalApi("load", { documentName: `note-${noteId}` }).catch(e => {
          console.error(`[Notes] Failed to load note-${noteId} from DB:`, e);
          return null;
        });
        
        if (loadRes && loadRes.documentState) {
          const buffer = Buffer.from(loadRes.documentState, "base64");
          Y.applyUpdate(doc, buffer);
        }
      }
      
      // Send current state to the joining client
      const update = Y.encodeStateAsUpdate(doc);
      if (callback) callback({ success: true, update: Buffer.from(update) });
      
    } catch (error) {
      console.error("[Note Join Error]:", error);
      if (callback) callback({ error: "Server error" });
    }
  });

  socket.on("note:update", (noteId: string, updateData: Buffer) => {
    const doc = documents.get(noteId);
    if (!doc) return; 
    
    try {
      // Apply update to server document
      Y.applyUpdate(doc, new Uint8Array(updateData));
      
      // Broadcast to other clients in the room
      socket.to(`note:${noteId}`).emit("note:update", noteId, updateData);
      
      // Debounce persistence (save to database after 3s of inactivity)
      if (persistenceTimeouts.has(noteId)) {
        clearTimeout(persistenceTimeouts.get(noteId)!);
      }
      
      persistenceTimeouts.set(noteId, setTimeout(async () => {
        try {
          const state = Y.encodeStateAsUpdate(doc);
          const stateBase64 = Buffer.from(state).toString("base64");
          
          await callInternalApi("store", {
            documentName: `note-${noteId}`,
            documentState: stateBase64,
          });
          console.log(`[Notes] Saved note-${noteId} to database.`);
        } catch (err) {
          console.error(`[Notes] Failed to save note-${noteId}:`, err);
        }
        persistenceTimeouts.delete(noteId);
      }, 3000));
      
    } catch (e) {
      console.error(`[Notes] Error processing update for note-${noteId}:`, e);
    }
  });

  socket.on("note:awareness", (noteId: string, awarenessData: Buffer) => {
    socket.to(`note:${noteId}`).emit("note:awareness", noteId, awarenessData);
  });
  
  socket.on("note:leave", (noteId: string) => {
    socket.leave(`note:${noteId}`);
  });
}
