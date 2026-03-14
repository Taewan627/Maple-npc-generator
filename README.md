# 🍁 메이플스토리 NPC 성격 대화 생성기
### MapleStory NPC Personality Dialogue Generator

> **Big Five 성격 모델 기반 LLM NPC 대화 생성 시스템**  
> A real-time NPC dialogue generation system powered by Gemini AI and the Big Five personality model.

[![Live Demo](https://img.shields.io/badge/🍁%20Live%20Demo-maple--npc--generator.vercel.app-brightgreen)](https://maple-npc-generator.vercel.app/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![Gemini](https://img.shields.io/badge/Powered%20by-Gemini%203%20Flash-blue)](https://ai.google.dev)

---

## 🎮 프로젝트 소개

20년간 게임회사에서 콘텐츠 및  레벨디자인을 담당하며 체감한 문제가 있습니다.  
**"수개월 공들여 만든 콘텐츠가 단 며칠 만에 고갈된다."**

NPC 대화는 게임 몰입감의 핵심이지만, 수백 명의 NPC에게 일일이 개성 있는 대사를 작성하는 것은 막대한 리소스가 필요합니다. 이 프로젝트는 심리학의 **Big Five 성격 모델**을 게임 NPC에 적용하여, AI가 NPC의 성격에 맞는 자연스러운 대화를 실시간으로 생성하는 시스템입니다.

> *"이론을 넘어선 실체 — 게임 개발 현장의 문제를 AI로 직접 해결합니다."*

---

## 🚀 Live Demo

**👉 [https://maple-npc-generator.vercel.app/](https://maple-npc-generator.vercel.app/)**

슬라이더로 NPC의 Big Five 성격 수치를 조정하고,  
실시간으로 달라지는 대화 스타일을 직접 체험해보세요.

---

## 🧠 Big Five 성격 모델 (OCEAN)

심리학의 표준 성격 모델을 NPC 대화 생성에 적용했습니다.

| 특성 | 영문 | 낮을 때 | 높을 때 |
|------|------|---------|---------|
| **개방성** | Openness | 전통적, 현실적 | 창의적, 호기심 많음 |
| **성실성** | Conscientiousness | 즉흥적, 유연함 | 체계적, 책임감 강함 |
| **외향성** | Extraversion | 조용함, 내성적 | 활발함, 사교적 |
| **친화성** | Agreeableness | 직설적, 경쟁적 | 공감적, 협력적 |
| **신경성** | Neuroticism | 안정적, 침착함 | 감정적, 예민함 |

각 수치는 LLM 프롬프트의 **personality 파라미터**로 변환되어 Gemini에 전달됩니다.  
신경성(Neuroticism) 수치는 모델의 `temperature` 값에도 직접 반영됩니다.

```
temperature = 0.7 + (neuroticism / 200)
```

---

## 🏗️ 시스템 아키텍처

```
[사용자 브라우저]
      │
      │  POST /api/chat (NPC 설정 + Big Five 수치 + 대화 히스토리)
      ▼
[Vercel Edge Function]  ← GEMINI_API_KEY (서버에만 존재, 외부 노출 없음)
      │
      │  Streaming SSE
      ▼
[Gemini 3 Flash Preview]
      │
      │  실시간 스트리밍 응답
      ▼
[사용자 화면에 타이핑 효과로 출력]
```

**API 키 보안:** 클라이언트 번들에 키를 포함하지 않고, Vercel 서버사이드 환경변수로만 관리합니다.

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **AI** | Google Gemini 3 Flash Preview (`gemini-3-flash-preview`) |
| **배포** | Vercel (Edge Functions) |
| **애니메이션** | Motion (Framer Motion) |
| **아이콘** | Lucide React |

---

## 📦 설치 및 실행

### 1. 레포지토리 클론
```bash
git clone https://github.com/Taewan627/maple-npc-generator.git
cd maple-npc-generator
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 환경변수 설정
```bash
cp .env.example .env
```
`.env` 파일을 열고 Gemini API 키 입력:
```
GEMINI_API_KEY=AIza...
```
> API 키 발급: [Google AI Studio](https://aistudio.google.com) → Get API key

### 4. 로컬 실행
```bash
npm run dev
```
`http://localhost:5173` 접속

---

## 📁 프로젝트 구조

```
├── api/
│   └── chat.ts              # Vercel Edge Function (Gemini API 호출, 키 보호)
├── src/
│   ├── App.tsx              # 메인 UI 컴포넌트
│   ├── types.ts             # Big Five 타입 정의
│   ├── services/
│   │   └── geminiService.ts # API Route 호출 및 SSE 스트림 파싱
│   └── data/
│       └── maple_knowledge.json  # 메이플스토리 세계관 지식베이스
├── vercel.json              # Vercel 라우팅 설정
└── vite.config.ts           # Vite 빌드 설정
```

---

## 🔬 논문 연구 연계

이 프로젝트는 다음 연구의 **실증 시스템(Proof of Concept)** 으로 개발되었습니다.

> **"LLM 기반 게임 NPC 페르소나의 성격 차별성 및 일관성 검증을 위한 정량적 프레임워크 연구: Big Five 모델을 중심으로"**  
> KCI 등재지 심사중 | 서강대학교 가상융합전문대학원

**연구 핵심 질문:**
- Big Five 수치 변화가 LLM 출력의 성격 차별성에 유의미한 영향을 주는가?
- 동일 NPC에 대한 반복 생성 시 성격 일관성이 유지되는가?
- 게임 개발 파이프라인에서 AI 기반 NPC 대화 생성이 제작 효율을 개선하는가?

이 시스템은 위 연구 가설을 검증하기 위한 **A/B 테스트 및 사용자 실험 플랫폼**으로 활용됩니다.

---

## 👤 개발자

**김태완 (Taewan Kim)**  
서강대학교 가상융합 테크놀로지전공 박사과정  

- 🤗 HuggingFace: [huggingface.co/devmeta](https://huggingface.co/devmeta)
- 🐙 GitHub: [github.com/Taewan627](https://github.com/Taewan627)

---

## 📄 License

MIT License
