import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveMessage } from "@/features/ai/actions/ai.actions";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, workspaceId, conversationId } = await req.json();

    // Fetch workspace context
    const [projects, tasks, members] = await Promise.all([
      prisma.project.findMany({
        where: { workspaceId },
        select: { id: true, name: true, description: true },
      }),
      prisma.task.findMany({
        where: { project: { workspaceId }, status: { not: "DONE" } },
        select: { title: true, status: true, priority: true, dueDate: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
      prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: { user: { select: { name: true } } },
      }),
    ]);

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    // Build system prompt with workspace context
    const systemPrompt = `You are DevSync AI, an intelligent assistant embedded inside the "${workspace?.name}" workspace — a collaborative project management platform.

You have full context of this workspace:

**Team Members (${members.length}):**
${members.map(m => `- ${m.user.name}`).join("\n") || "No members yet."}

**Projects (${projects.length}):**
${projects.map(p => `- ${p.name}${p.description ? ": " + p.description : ""}`).join("\n") || "No projects yet."}

**Open Tasks (${tasks.length} active):**
${tasks.map(t => `- [${t.status}] [${t.priority}] ${t.title}${t.dueDate ? " (due: " + new Date(t.dueDate).toDateString() + ")" : ""}`).join("\n") || "No open tasks."}

You can help with:
- Summarizing project status and task progress
- Suggesting task prioritization and management strategies
- Writing code, documentation, and technical content
- Answering questions about the workspace and its data
- Brainstorming features, solutions, and ideas
- General programming and technical questions

Be concise, professional, and helpful. Use markdown formatting for code and lists. Always speak as if you are embedded in this workspace.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Build chat history from all previous messages (excluding the last user message)
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood! I'm ready to assist the team." }] },
        ...history,
      ],
    });

    const lastUserMessage = messages[messages.length - 1].content;

    // Stream the response
    const result = await chat.sendMessageStream(lastUserMessage);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        for await (const chunk of result.stream) {
          const text = chunk.text();
          fullText += text;
          // Vercel AI SDK data stream format
          controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
        }
        controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));
        controller.close();

        // Save messages to DB
        if (conversationId) {
          try {
            await saveMessage(conversationId, "user", lastUserMessage);
            await saveMessage(conversationId, "assistant", fullText);
          } catch (e) {
            console.error("Failed to save AI messages to DB:", e);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const status = (error as { status?: number })?.status;
    console.error("[AI CHAT ERROR]", { message, status, error });
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}
