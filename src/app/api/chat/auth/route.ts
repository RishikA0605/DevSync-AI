import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "AUTH_SECRET missing" }, { status: 500 });
    }

    // Sign a short-lived token exclusively for WebSocket authentication
    const token = jwt.sign(
      {
        userId: session.user.id,
        name: session.user.name,
        image: session.user.image,
      },
      secret,
      { expiresIn: "1h" }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Socket Auth Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
