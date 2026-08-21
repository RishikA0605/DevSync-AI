import { Hocuspocus } from "@hocuspocus/server";
import * as Y from "yjs";
import dotenv from "dotenv";

dotenv.config();

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
const INTERNAL_SECRET = process.env.INTERNAL_SOCKET_SECRET || "devsync-internal-secret";

// Helper to call our Next.js internal APIs
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

// ──────────────────────────────────────────────────────────────────────────────
// STEP 1: Minimal Hocuspocus — NO auth, NO load, NO store.
// Just prove the WebSocket connection works end-to-end.
// Once this shows "Saved" in the browser, we'll add auth/load/store back.
// ──────────────────────────────────────────────────────────────────────────────
const hocuspocusInstance = new Hocuspocus({
  async onConnect(data) {
    console.log(`[Hocuspocus] ✅ Client connected for document: ${data.documentName}`);
  },
  async onDisconnect(data) {
    console.log(`[Hocuspocus] ❌ Client disconnected from: ${data.documentName}`);
  },
  // NO onAuthenticate — allow all connections for now
  // NO onLoadDocument — use in-memory doc
  // NO onStoreDocument — changes are only in memory
});

export const hocuspocusServer = hocuspocusInstance.configure({}) as any;
