// TTS 페르소나 5종 — 백엔드 GET /api/v1/tts/personas 와 동일한 id·메타.
// (백엔드 domain/tts/tts_service.py 가 진실의 원천. 여기엔 UI 표시용 색/말속도/소개를 더함.)

export const COACH_CHARACTER_IDS = [
  'mate',
  'director',
  'quest',
  'coach',
  'mentor',
] as const;
export type CoachCharacterId = (typeof COACH_CHARACTER_IDS)[number];

/** 부모가 안내 친구를 안 정했을 때 기본값 = 존댓말(반말 미지원) 페르소나 */
export const DEFAULT_COACH_ID: CoachCharacterId = 'mentor';

export type CoachCharacterMeta = {
  id: CoachCharacterId;
  name: string;
  toneLabel: string;
  emoji: string;
  bg: string;
  ring: string;
  ttsRate: number;
  /** 반말 모드 지원 여부 (백엔드 supports_informal) */
  supportsInformal: boolean;
  /** 나이 자동 추천용 (백엔드 recommended_ages) */
  recommendedAges: number[];
  goodFor: string;
  /** 존댓말 미리듣기 문장 */
  introSample: string;
  /** 반말 미리듣기 문장 (미지원 페르소나는 존댓말과 동일) */
  introSampleInformal: string;
  /** 변경 안내 (존댓말) */
  changeAnnounce: string;
  /** 변경 안내 (반말) */
  changeAnnounceInformal: string;
};

export const COACH_CHARACTERS: Record<CoachCharacterId, CoachCharacterMeta> = {
  mate: {
    id: 'mate',
    name: '촬영 메이트',
    toneLabel: '편한 또래 · 반말 가능',
    emoji: '📱',
    bg: '#E8F8FB',
    ring: '#00B8CF',
    ttsRate: 1.05,
    supportsInformal: true,
    recommendedAges: [10, 11, 12],
    goodFor: '부담 없이 또래처럼 가볍게 안내받고 싶을 때',
    introSample: '지금 각도 괜찮아요. 평소 표정이면 돼요.',
    introSampleInformal: '지금 각도 괜찮아. 평소 표정이면 돼.',
    changeAnnounce: '오늘부터 촬영 메이트가 안내할게요.',
    changeAnnounceInformal: '오늘부터 촬영 메이트가 안내할게!',
  },
  director: {
    id: 'director',
    name: '촬영 디렉터',
    toneLabel: '존댓말 · 이유 + 지시',
    emoji: '🎬',
    bg: '#EEF1FF',
    ring: '#5B6CFF',
    ttsRate: 1.0,
    supportsInformal: false,
    recommendedAges: [13, 14, 15, 16, 17, 18, 19],
    goodFor: '왜 이렇게 찍는지 짧은 이유와 지시가 필요할 때',
    introSample: '그 포즈 그대로 유지하세요. 눈은 렌즈 쪽만 보시면 됩니다.',
    introSampleInformal: '그 포즈 그대로 유지하세요. 눈은 렌즈 쪽만 보시면 됩니다.',
    changeAnnounce: '오늘부터 촬영 디렉터가 안내합니다.',
    changeAnnounceInformal: '오늘부터 촬영 디렉터가 안내합니다.',
  },
  quest: {
    id: 'quest',
    name: '촬영 퀘스트 가이드',
    toneLabel: '존댓말 · 게임 퀘스트풍',
    emoji: '🎮',
    bg: '#F3ECFF',
    ring: '#9B5BFF',
    ttsRate: 1.05,
    supportsInformal: false,
    recommendedAges: [10, 11, 12, 16, 17, 18, 19],
    goodFor: '게임처럼 짧고 명확한 미션이 동기가 될 때',
    introSample: '촬영 퀘스트를 시작합니다. 화면 중앙 정렬이 목표예요.',
    introSampleInformal: '촬영 퀘스트를 시작합니다. 화면 중앙 정렬이 목표예요.',
    changeAnnounce: '오늘부터 촬영 퀘스트 가이드가 안내합니다.',
    changeAnnounceInformal: '오늘부터 촬영 퀘스트 가이드가 안내합니다.',
  },
  coach: {
    id: 'coach',
    name: '코치 / 연습실 선배',
    toneLabel: '당당한 지시 · 반말 가능',
    emoji: '🏃',
    bg: '#FFF1E8',
    ring: '#FF7A45',
    ttsRate: 1.0,
    supportsInformal: true,
    recommendedAges: [10, 11, 12, 13, 14, 15],
    goodFor: '짧고 당당한 지시로 집중하게 도와줄 때',
    introSample: '좋아요, 자세는 지금이 딱입니다. 시선만 렌즈로 맞춰 주세요.',
    introSampleInformal: '좋아, 자세는 지금이 딱이야. 시선만 렌즈로.',
    changeAnnounce: '오늘부터 코치가 안내할게요.',
    changeAnnounceInformal: '오늘부터 코치가 안내할게.',
  },
  mentor: {
    id: 'mentor',
    name: '편한 멘토',
    toneLabel: '존댓말 · 느리고 부드럽게',
    emoji: '☕',
    bg: '#F0F2F4',
    ring: '#828C94',
    ttsRate: 0.9,
    supportsInformal: false,
    recommendedAges: [13, 14, 15, 16, 17, 18, 19],
    goodFor: '긴장을 풀고 천천히 안내받고 싶을 때 (기본 안내 친구)',
    introSample: '급하게 안 하셔도 돼요. 카메라만 편하게 보시면 됩니다.',
    introSampleInformal: '급하게 안 하셔도 돼요. 카메라만 편하게 보시면 됩니다.',
    changeAnnounce: '오늘부터 편한 멘토가 안내할게요.',
    changeAnnounceInformal: '오늘부터 편한 멘토가 안내할게요.',
  },
};

export function normalizeCoachCharacterId(id: string | null | undefined): CoachCharacterId {
  if (id && id in COACH_CHARACTERS) return id as CoachCharacterId;
  // 구버전 캐릭터(jiu/seoyeon/hajun) 호환 매핑.
  // jiu 는 과거 기본값이었으므로 존댓말 기본(mentor)으로 매핑한다.
  if (id === 'jiu') return 'mentor';
  if (id === 'seoyeon') return 'mentor';
  if (id === 'hajun') return 'coach';
  return DEFAULT_COACH_ID;
}

export function resolveEffectiveCoachId(
  familyDefault: string | null | undefined,
  childOverride: string | null | undefined,
  apiEffective?: string | null,
): CoachCharacterId {
  if (apiEffective) return normalizeCoachCharacterId(apiEffective);
  if (childOverride) return normalizeCoachCharacterId(childOverride);
  return normalizeCoachCharacterId(familyDefault);
}

/** 반말 미지원 페르소나면 informal 요청을 무시(false) — 백엔드 폴백과 동일 */
export function resolveEffectiveInformal(
  id: CoachCharacterId,
  requested: boolean | null | undefined,
): boolean {
  return !!requested && COACH_CHARACTERS[id].supportsInformal;
}

/** 자녀 나이에 맞는 추천 페르소나 id 목록 (선택사항 UI 배지용) */
export function recommendedPersonaIdsForAge(age: number | null | undefined): CoachCharacterId[] {
  if (age == null) return [];
  return COACH_CHARACTER_IDS.filter((id) => COACH_CHARACTERS[id].recommendedAges.includes(age));
}

export function coachIntroSample(id: CoachCharacterId, informal: boolean): string {
  const meta = COACH_CHARACTERS[id];
  return informal && meta.supportsInformal ? meta.introSampleInformal : meta.introSample;
}

export function coachChangeAnnounce(id: CoachCharacterId, informal: boolean): string {
  const meta = COACH_CHARACTERS[id];
  return informal && meta.supportsInformal ? meta.changeAnnounceInformal : meta.changeAnnounce;
}
