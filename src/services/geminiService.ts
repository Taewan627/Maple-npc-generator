import { BigFive, NPCSettings } from "../types";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
}

export class GeminiService {
  // API 키는 클라이언트에 없음 - 서버(Vercel API Route)가 처리
  async *generateDialogueStream(
    npc: NPCSettings,
    traits: BigFive,
    context: string,
    knowledgeContext: string,
    history: ChatMessage[],
    currentMessage: string,
    traitPromptMapping: (trait: keyof BigFive, value: number) => string,
    onMetadata?: (metadata: any) => void
  ) {
    const personality = (Object.keys(traits) as Array<keyof BigFive>)
      .map((key) => traitPromptMapping(key, traits[key]))
      .join(", ");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        npc,
        traits,
        context,
        knowledgeContext,
        history,
        currentMessage,
        personality,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `Server error: ${response.status}`);
    }

    // SSE 스트림 파싱
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data);
          if (parsed.text) {
            yield parsed.text as string;
          }
          if (parsed.metadata && onMetadata) {
            onMetadata(parsed.metadata);
          }
        } catch {
          // 파싱 실패 라인 무시
        }
      }
    }
  }
}
