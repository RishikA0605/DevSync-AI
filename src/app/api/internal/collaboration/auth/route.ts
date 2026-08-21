import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const INTERNAL_SECRET = process.env.INTERNAL_SOCKET_SECRET || "devsync-internal-secret";
const AUTH_SECRET = process.env.AUTH_SECRET;

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-internal-secret");
    if (secret !== INTERNAL_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, documentName } = body; // documentName format: "note-<id>"

    if (!token || !documentName) {
      return NextResponse.json({ error: "Missing token or documentName" }, { status: 400 });
    }

    // Extract noteId
    const noteId = documentName.startsWith("note-") ? documentName.split("note-")[1] : null;
    if (!noteId) {
      return NextResponse.json({ error: "Invalid documentName format" }, { status: 400 });
    }

    // Decode JWT
    if (!AUTH_SECRET) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, AUTH_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid JWT token" }, { status: 401 });
    }

    const userId = decoded.userId || decoded.id; // NextAuth standard is id or userId depending on our auth callback
    if (!userId) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    // Check Note existence and workspace
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { workspaceId: true },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check Membership and Role
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: note.workspaceId,
        },
      },
      select: { role: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "User not in workspace" }, { status: 403 });
    }

    // If GUEST, they are strictly read-only
    const isReadOnly = membership.role === "GUEST";

    return NextResponse.json({
      authorized: true,
      role: membership.role,
      isReadOnly,
      userId,
    });
  } catch (error) {
    console.error("[Internal API Auth] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
