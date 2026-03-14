import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { npc, traits, context, knowledgeContext, history, currentMessage, personality } = body;

    const systemInstruction = `
NPC: ${npc.name} (${npc.role}, ${npc.region})
Backstory: ${npc.backstory}
Personality: ${personality}

[Rules]
1. Priority: Reflect current personality keywords above all.
2. Style: Warm, pastel-tone MapleStory vibe.
3. Length: 2-3 sentences max.
4. Knowledge: Use the lore below naturally.

${knowledgeContext}
Context: ${context}
`.trim();

    const ai = new GoogleGenAI({ apiKey });

    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction,
        temperature: 0.7 + (traits.neuroticism / 200),
      },
      history: history.map((m: { role: string; content: string }) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
    });

    // Streaming response
    const result = await chat.sendMessageStream({ message: currentMessage });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result) {
            const text = chunk.text || "";
            if (text) {
              // SSE 형식으로 전송
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
            // 토큰 메타데이터
            if (chunk.usageMetadata) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ metadata: chunk.usageMetadata })}\n\n`
                )
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
