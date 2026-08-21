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
    const { documentName, documentState } = body; 

    if (!documentName || !documentState) {
      return NextResponse.json({ error: "Missing documentName or documentState" }, { status: 400 });
    }

    const noteId = documentName.startsWith("note-") ? documentName.split("note-")[1] : null;
    if (!noteId) {
      return NextResponse.json({ error: "Invalid documentName format" }, { status: 400 });
    }

    // Convert Base64 string back to Buffer for Prisma Bytes
    const buffer = Buffer.from(documentState, "base64");

    await prisma.note.update({
      where: { id: noteId },
      data: { documentState: buffer },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Internal API Store Note] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
