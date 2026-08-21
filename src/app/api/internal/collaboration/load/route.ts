import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INTERNAL_SECRET = process.env.INTERNAL_SOCKET_SECRET || "devsync-internal-secret";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-internal-secret");
    if (secret !== INTERNAL_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentName } = body; 

    if (!documentName) {
      return NextResponse.json({ error: "Missing documentName" }, { status: 400 });
    }

    const noteId = documentName.startsWith("note-") ? documentName.split("note-")[1] : null;
    if (!noteId) {
      return NextResponse.json({ error: "Invalid documentName format" }, { status: 400 });
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { documentState: true },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Convert Buffer to Base64 string for JSON transport
    const stateBase64 = note.documentState ? Buffer.from(note.documentState).toString("base64") : null;

    return NextResponse.json({
      success: true,
      documentState: stateBase64,
    });
  } catch (error) {
    console.error("[Internal API Load Note] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
