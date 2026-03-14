import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings, 
  User, 
  MapPin, 
  ScrollText, 
  MessageSquare, 
  Sparkles, 
  Activity, 
  Cpu, 
  Clock, 
  Database,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { 
  BigFive, 
  NPCSettings, 
  Telemetry, 
  BIG_FIVE_LABELS, 
  BIG_FIVE_DESCRIPTIONS, 
  BIG_FIVE_PROMPT_MAPPING 
} from "./types";
import mapleKnowledge from "./data/maple_knowledge.json";
import { GeminiService, ChatMessage } from "./services/geminiService";

const INITIAL_NPC: NPCSettings = {
  name: "장로 헬레나",
  role: "궁수 전직관",
  region: "헤네시스",
  backstory: "검은 마법사와의 전쟁에서 살아남은 영웅 중 한 명입니다."
};

const INITIAL_TRAITS: BigFive = {
  openness: 61,
  conscientiousness: 71,
  extraversion: 50,
  agreeableness: 90,
  neuroticism: 20
};

// --- Sub-components ---

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      setHasError(true);
      setError(e.error);
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black text-persona-dark-text mb-2 tracking-tighter">오류가 발생했습니다</h1>
        <p className="text-persona-dark-text/60 mb-6 max-w-md">{error?.message || "알 수 없는 오류가 발생했습니다."}</p>
        <button 
          onClick={() => window.location.reload()}
          className="maple-button"
        >
          새로고침
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  // --- State ---
  const [npc, setNpc] = useState<NPCSettings>(INITIAL_NPC);
  const [traits, setTraits] = useState<BigFive>(INITIAL_TRAITS);
  const [userInput, setUserInput] = useState("");
  const [context, setContext] = useState("첫 만남");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const geminiService = useMemo(() => new GeminiService(), []);

  // --- Auto Scroll ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Helpers ---
  const getTraitLevel = (value: number) => {
    if (value < 20) return 0;
    if (value < 40) return 1;
    if (value < 60) return 2;
    if (value < 80) return 3;
    return 4;
  };

  const getTraitDescription = (trait: keyof BigFive, value: number) => {
    const level = getTraitLevel(value);
    return BIG_FIVE_DESCRIPTIONS[trait][level];
  };

  const getTraitPromptWord = (trait: keyof BigFive, value: number) => {
    const level = getTraitLevel(value);
    return BIG_FIVE_PROMPT_MAPPING[trait][level];
  };

  // --- RAG Logic ---
  const getKnowledgeContext = useMemo(() => {
    const regionData = (mapleKnowledge.regions as any)[npc.region] || {};
    const npcData = (mapleKnowledge.npcs as any)[npc.name] || {};
    
    return `
[Lore: ${npc.region}] ${regionData.description?.slice(0, 100) || ""}
[Atmosphere] ${regionData.atmosphere || ""}
[NPC: ${npc.name}] ${npcData.lore?.slice(0, 100) || npc.backstory.slice(0, 100)}
    `.trim();
  }, [npc.region, npc.name, npc.role, npc.backstory]);

  // --- API Call (Streaming) ---
  const generateDialogue = async () => {
    if (!userInput.trim() || isGenerating) return;
    
    const currentInput = userInput;
    const historyForGemini = [...messages];

    setUserInput("");
    setIsGenerating(true);
    const startTime = Date.now();

    const userMsgId = Date.now().toString();
    const modelMsgId = (Date.now() + 1).toString();

    setMessages(prev => [
      ...prev, 
      { id: userMsgId, role: "user", content: currentInput },
      { id: modelMsgId, role: "model", content: "" }
    ]);

    try {
      const stream = geminiService.generateDialogueStream(
        npc,
        traits,
        context,
        getKnowledgeContext,
        historyForGemini,
        currentInput,
        getTraitPromptWord,
        (metadata) => {
          if (metadata.totalTokenCount) {
            setTelemetry(prev => ({
              ...prev!,
              promptTokens: metadata.promptTokenCount || 0,
              responseTokens: metadata.candidatesTokenCount || 0,
              totalTokens: metadata.totalTokenCount || 0
            }));
          }
        }
      );

      let fullText = "";
      for await (const chunkText of stream) {
        fullText += chunkText;
        setMessages(prev => {
          const newMessages = [...prev];
          const modelMsgIndex = newMessages.findIndex(m => m.id === modelMsgId);
          if (modelMsgIndex !== -1) {
            newMessages[modelMsgIndex] = { ...newMessages[modelMsgIndex], content: fullText };
          }
          return newMessages;
        });
      }

      // Update Telemetry Latency
      const endTime = Date.now();
      setTelemetry(prev => ({
        promptTokens: prev?.promptTokens || 0,
        responseTokens: prev?.responseTokens || 0,
        totalTokens: prev?.totalTokens || 0,
        latency: endTime - startTime
      }));

    } catch (error) {
      console.error("Generation Error:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0) {
          newMessages[newMessages.length - 1] = { role: "model", content: "오류가 발생했습니다. 다시 시도해주세요." };
        }
        return newMessages;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setTelemetry(null);
  };

  const resetAll = () => {
    setNpc(INITIAL_NPC);
    setTraits(INITIAL_TRAITS);
    setContext("첫 만남");
    setMessages([]);
    setTelemetry(null);
    setUserInput("");
  };

  return (
    <div className="min-h-screen p-6 lg:p-12 max-w-[1600px] mx-auto">
      <header className="mb-12 text-center lg:text-left">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-persona-panel/10 border border-persona-panel/20 text-persona-panel text-[10px] font-bold uppercase tracking-widest mb-4"
        >
          <Sparkles className="w-3 h-3" />
          <span>Next-Gen NPC Interaction</span>
        </motion.div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-persona-dark-text">
              Maple<span className="text-persona-panel">Persona</span>
            </h1>
            <p className="text-persona-dark-text/60 mt-3 font-medium text-lg">AI 엔지니어 포트폴리오: RAG & 성격 모델링</p>
          </div>
          <button 
            onClick={resetAll}
            className="px-4 py-2 bg-white hover:bg-red-500/10 border border-persona-panel/10 hover:border-red-500/20 text-persona-dark-text/60 hover:text-red-500 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 self-center lg:self-end shadow-sm"
          >
            <Clock className="w-3.5 h-3.5" />
            Reset All Configuration
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full lg:h-[850px]">
        
        {/* 1. NPC Settings Panel */}
        <motion.section 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="maple-card flex flex-col gap-6 overflow-y-auto bg-[#2f3a64]"
        >
          <div className="flex items-center gap-2 mb-2 text-persona-accent font-bold text-lg">
            <Settings className="w-5 h-5" />
            <h2 className="tracking-tight text-persona-text">NPC 설정 및 환경</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-persona-text/50 flex items-center gap-1 mb-2 uppercase tracking-widest">
                <User className="w-3 h-3" /> 이름
              </label>
              <input 
                className="maple-input"
                value={npc.name}
                onChange={(e) => setNpc({ ...npc, name: e.target.value })}
                placeholder="예: 헬레나"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-persona-text/50 flex items-center gap-1 mb-2 uppercase tracking-widest">
                <ScrollText className="w-3 h-3" /> 직업 / 역할
              </label>
              <input 
                className="maple-input"
                value={npc.role}
                onChange={(e) => setNpc({ ...npc, role: e.target.value })}
                placeholder="예: 궁수 전직관"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-persona-text/50 flex items-center gap-1 mb-2 uppercase tracking-widest">
                <MapPin className="w-3 h-3" /> 소속 지역
              </label>
              <select 
                className="maple-input"
                value={npc.region}
                onChange={(e) => setNpc({ ...npc, region: e.target.value })}
              >
                {Object.keys(mapleKnowledge.regions).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-persona-text/50 flex items-center gap-1 mb-2 uppercase tracking-widest">
                <Database className="w-3 h-3" /> 배경 스토리
              </label>
              <textarea 
                className="maple-input h-40 resize-none leading-relaxed"
                value={npc.backstory}
                onChange={(e) => setNpc({ ...npc, backstory: e.target.value })}
                placeholder="NPC의 과거사나 특징을 입력하세요..."
              />
            </div>
          </div>
          
          <div className="mt-auto p-4 bg-white/5 rounded-xl border border-white/10 text-[11px] text-persona-text/70 leading-relaxed">
            <p className="font-bold mb-1 text-persona-accent flex items-center gap-1">
              <Cpu className="w-3 h-3" /> RAG 상태:
            </p>
            <p><strong>{npc.region}</strong> 지역 지식 베이스가 활성화되었습니다. 대화 생성 시 해당 지역의 로어가 자동으로 주입됩니다.</p>
          </div>
        </motion.section>

        {/* 2. Big Five Sliders Panel */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="maple-card flex flex-col gap-8 overflow-y-auto bg-[#2f3a64]"
        >
          <div className="flex items-center gap-2 mb-2 text-persona-accent font-bold text-lg">
            <Activity className="w-5 h-5" />
            <h2 className="tracking-tight text-persona-text">성격 모델링 (Big Five)</h2>
          </div>

          <div className="space-y-10">
            {(Object.keys(traits) as Array<keyof BigFive>).map((trait) => (
              <div key={trait} className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-persona-text/90 text-xs uppercase tracking-wider">{BIG_FIVE_LABELS[trait]}</label>
                  <span className="text-persona-accent font-black text-sm font-mono">{traits[trait]}</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={traits[trait]}
                  onChange={(e) => setTraits({ ...traits, [trait]: parseInt(e.target.value) })}
                  className="maple-slider"
                />
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={`${trait}-${getTraitLevel(traits[trait])}`}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="text-[11px] text-persona-text/70 leading-relaxed min-h-[32px] font-medium"
                  >
                    {getTraitDescription(trait, traits[trait])}
                  </motion.p>
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 3. Dialogue Generation Panel (KakaoTalk Style) */}
        <motion.section 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="maple-card flex flex-col h-full overflow-hidden bg-[#2f3a64]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-persona-accent font-bold text-lg">
              <MessageSquare className="w-5 h-5" />
              <h2 className="tracking-tight text-persona-text">추론 콘솔 (Dialogue)</h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={clearChat}
                className="px-2 py-1 text-[9px] font-black text-persona-text/30 hover:text-persona-accent transition-colors uppercase tracking-widest border border-white/5 rounded-md hover:bg-white/5"
              >
                Clear Memory
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/10">
                <div className={`w-1.5 h-1.5 rounded-full ${isGenerating ? "bg-persona-accent animate-pulse" : "bg-white/20"}`} />
                <span className="text-[9px] font-black text-persona-accent uppercase tracking-tighter">{isGenerating ? "Processing" : "Idle"}</span>
              </div>
            </div>
          </div>

          {/* Integrated Telemetry Monitor (Fixed at Top) */}
          <div className="mb-6 bg-black/20 rounded-xl p-4 font-mono text-[10px] text-persona-accent border border-white/5 shadow-inner">
            <div className="flex items-center gap-2 mb-3 opacity-50 border-b border-white/5 pb-2">
              <Cpu className="w-3 h-3" />
              <span className="uppercase tracking-widest font-black">System Metrics</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-persona-text/30 text-[8px] font-black mb-1 uppercase">Latency</p>
                <p className="font-bold text-xs">{telemetry?.latency ? `${telemetry.latency}ms` : "---"}</p>
              </div>
              <div>
                <p className="text-persona-text/30 text-[8px] font-black mb-1 uppercase">Tokens</p>
                <p className="font-bold text-xs">{(telemetry?.totalTokens !== undefined && telemetry?.totalTokens !== 0) ? telemetry.totalTokens : "---"}</p>
              </div>
              <div>
                <p className="text-persona-text/30 text-[8px] font-black mb-1 uppercase">Provider</p>
                <p className="font-bold text-[10px] truncate">Gemini 3 Flash</p>
              </div>
            </div>
            <div className="pt-2 border-t border-white/5 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[8px] text-emerald-400/80 font-black uppercase tracking-widest">
                Retrieved Knowledge: <span className="text-emerald-300">{npc.region} Lore DB</span>
              </p>
            </div>
          </div>

          {/* Context Input */}
          <div className="mb-6">
            <label className="text-[9px] font-black text-persona-text/30 mb-2 block uppercase tracking-widest">상황 컨텍스트</label>
            <input 
              className="maple-input"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="예: 첫 만남, 상점에서..."
            />
          </div>

          {/* Chat History (Middle - Scrollable) */}
          <div className="flex-1 p-5 bg-black/10 rounded-2xl border border-white/5 overflow-y-auto space-y-5 mb-6 min-h-0 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg text-sm leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-persona-accent text-persona-dark-text font-bold rounded-tr-none" 
                        : "bg-white/10 text-persona-text border border-white/10 rounded-tl-none backdrop-blur-md"
                    }`}>
                      {msg.role === "model" && (
                        <span className="text-[9px] font-black block mb-1.5 text-persona-accent uppercase tracking-widest">[{npc.name}]</span>
                      )}
                      {msg.content || (isGenerating && messages[messages.length - 1]?.id === msg.id ? "..." : "")}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-persona-text/20 italic text-center gap-3">
                  <MessageSquare className="w-10 h-10 opacity-10" />
                  <p className="text-[11px] font-medium">NPC에게 말을 걸어보세요.<br/>(예: "당신은 누구신가요?")</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </AnimatePresence>
          </div>

          {/* Chat Input (Bottom) */}
          <div className="flex gap-3 items-end">
            <textarea 
              className="maple-input flex-1 h-24 resize-none text-sm py-4 px-5 leading-relaxed"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generateDialogue();
                }
              }}
              placeholder="메시지를 입력하세요..."
            />
            <button 
              onClick={generateDialogue}
              disabled={isGenerating || !userInput.trim()}
              className="maple-button h-24 w-24 flex flex-col items-center justify-center gap-2 shrink-0"
            >
              {isGenerating ? (
                <div className="w-6 h-6 border-3 border-persona-dark-text/20 border-t-persona-dark-text rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Send</span>
                </>
              )}
            </button>
          </div>
        </motion.section>
      </div>

      {/* Floating Telemetry Removed as requested */}
    </div>
  );
}
