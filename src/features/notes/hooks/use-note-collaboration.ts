import { useEffect, useState } from "react";
import * as Y from "yjs";
import { io, Socket } from "socket.io-client";
import * as awarenessProtocol from "y-protocols/awareness";

export function useNoteCollaboration(noteId: string, token: string, currentUser: any) {
  const [provider, setProvider] = useState<any>(null);
  const [status, setStatus] = useState<"connecting" | "saved" | "saving" | "offline">("connecting");

  useEffect(() => {
    // 1. Setup Socket.io connection on port 3001
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const socket: Socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    // 2. Setup local Yjs Document and Awareness
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    
    // Set our local user state
    awareness.setLocalStateField("user", {
      name: currentUser.name,
      color: currentUser.color || "#6366f1",
    });

    // We simulate the Provider interface that BlockNote expects
    // BlockNote uses the 'document' and 'awareness' fields.
    const simulatedProvider = {
      document: doc,
      awareness,
      // Minimal event emitter stubs if BlockNote tries to listen
      on: () => {},
      off: () => {},
      destroy: () => {
        socket.disconnect();
        doc.destroy();
        awareness.destroy();
      }
    };

    // 3. Socket.io Event Handlers
    socket.on("connect", () => {
      setStatus("connecting");
      
      // Request to join the note room
      socket.emit("note:join", noteId, (response: any) => {
        if (response?.error) {
          console.error("Failed to join note:", response.error);
          setStatus("offline");
          return;
        }
        
        // If server sent initial state, apply it
        if (response?.update) {
           Y.applyUpdate(doc, new Uint8Array(response.update));
        }
        setStatus("saved");
      });
    });
    
    socket.on("disconnect", () => {
      setStatus("offline");
    });

    // Receive document updates from other users
    socket.on("note:update", (id: string, updateData: ArrayBuffer) => {
      if (id === noteId) {
        Y.applyUpdate(doc, new Uint8Array(updateData));
      }
    });

    // Receive awareness updates from other users
    socket.on("note:awareness", (id: string, awarenessData: ArrayBuffer) => {
      if (id === noteId) {
        awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(awarenessData), socket);
      }
    });

    // 4. Send local changes to the server
    
    // Listen to local doc updates and broadcast them
    doc.on("update", (update: Uint8Array, origin: any) => {
      // Don't echo updates that came FROM the socket
      if (origin !== socket) {
        setStatus("saving");
        socket.emit("note:update", noteId, Buffer.from(update));
        
        // Reset to saved after a short delay to simulate "saved" indicator
        setTimeout(() => {
          setStatus((prev) => prev === "saving" ? "saved" : prev);
        }, 1500);
      }
    });

    // Listen to local awareness changes and broadcast them
    awareness.on("update", ({ added, updated, removed }: any, origin: any) => {
      if (origin !== socket) {
        const changedClients = added.concat(updated).concat(removed);
        const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
        socket.emit("note:awareness", noteId, Buffer.from(update));
      }
    });

    // Expose the provider to the React component
    setProvider(simulatedProvider);

    return () => {
      socket.emit("note:leave", noteId);
      socket.disconnect();
      doc.destroy();
      awareness.destroy();
    };
  }, [noteId, token]);

  return { provider, status };
}
