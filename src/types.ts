export interface BigFive {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface NPCSettings {
  name: string;
  role: string;
  region: string;
  backstory: string;
}

export interface Telemetry {
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  latency: number;
}

export const BIG_FIVE_LABELS: Record<keyof BigFive, string> = {
  openness: "개방성 (Openness)",
  conscientiousness: "성실성 (Conscientiousness)",
  extraversion: "외향성 (Extraversion)",
  agreeableness: "친화성 (Agreeableness)",
  neuroticism: "신경성 (Neuroticism)",
};

export const BIG_FIVE_DESCRIPTIONS: Record<keyof BigFive, string[]> = {
  openness: [
    "매우 보수적이고 변화를 싫어하며, 익숙한 것만을 고집합니다.",
    "다소 실용적이고 현실적이며, 새로운 아이디어에 신중합니다.",
    "새로운 경험에 대해 열려 있으며, 적절한 호기심을 가집니다.",
    "창의적이고 상상력이 풍부하며, 새로운 지식을 배우는 것을 즐깁니다.",
    "극도로 개방적이고 혁신적이며, 세상의 모든 신비에 깊이 몰입합니다."
  ],
  conscientiousness: [
    "매우 즉흥적이고 무질서하며, 계획 세우기를 극도로 꺼립니다.",
    "다소 산만하고 마감 기한을 지키는 데 어려움을 겪기도 합니다.",
    "필요한 만큼의 책임감을 가지고 있으며, 평범한 수준의 성실함을 보입니다.",
    "체계적이고 신뢰할 수 있으며, 자신의 목표를 향해 꾸준히 정진합니다.",
    "완벽주의적이고 극도로 철저하며, 작은 실수도 용납하지 않는 성실함의 표본입니다."
  ],
  extraversion: [
    "극도로 내향적이고 고독을 즐기며, 타인과의 접촉을 최소화합니다.",
    "조용하고 수줍음이 많으며, 소수의 사람들과만 깊게 교류합니다.",
    "상황에 따라 사교적일 수 있으며, 적절한 사회적 에너지를 가집니다.",
    "활발하고 에너지가 넘치며, 사람들과 어울리는 것을 진심으로 좋아합니다.",
    "극도로 외향적이고 열정적이며, 항상 대화의 중심에 서기를 원합니다."
  ],
  agreeableness: [
    "매우 냉소적이고 비협조적이며, 타인의 감정에 무관심합니다.",
    "다소 비판적이고 경쟁적이며, 자신의 이익을 먼저 생각하는 경향이 있습니다.",
    "타인에게 우호적이고 협력적이며, 원만한 대인관계를 유지합니다.",
    "매우 친절하고 이타적이며, 타인을 돕는 것에서 큰 기쁨을 느낍니다.",
    "성인군자와 같은 자애로움을 지녔으며, 모든 이를 포용하고 공감합니다."
  ],
  neuroticism: [
    "극도로 정서적으로 안정되어 있으며, 어떤 위기 상황에서도 평정심을 유지합니다.",
    "차분하고 스트레스에 강하며, 감정의 기복이 거의 없습니다.",
    "일반적인 수준의 감정 변화를 겪으며, 적절히 스트레스를 관리합니다.",
    "다소 예민하고 걱정이 많으며, 작은 일에도 쉽게 불안해할 수 있습니다.",
    "극도로 신경질적이고 감정 기복이 심하며, 항상 불안과 긴장 속에 살아갑니다."
  ]
};

export const BIG_FIVE_PROMPT_MAPPING: Record<keyof BigFive, string[]> = {
  openness: ["보수적인", "현실적인", "호기심 있는", "창의적인", "혁신적인"],
  conscientiousness: ["즉흥적인", "자유로운", "성실한", "체계적인", "완벽주의적인"],
  extraversion: ["고독한", "조용한", "사교적인", "활발한", "열정적인"],
  agreeableness: ["냉소적인", "비판적인", "우호적인", "이타적인", "자애로운"],
  neuroticism: ["평온한", "차분한", "예민한", "불안해하는", "격정적인"]
};
