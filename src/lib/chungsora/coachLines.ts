import { ghostSlotConfig } from '@/lib/chungsora/ghostSlots';
import { COACH_CHARACTERS, type CoachCharacterId } from '@/lib/chungsora/coachCharacters';

export type CaptureCoachMode = 'dirty' | 'after' | 'baseline';

export type CoachLinePhase =
  | 'mode_intro'
  | 'slot_enter'
  | 'align_hint'
  | 'shutter'
  | 'slot_done'
  | 'before_done'
  | 'quest_enter'
  | 'baseline_eval'
  | 'baseline_pass'
  | 'after_score'
  | 'unlock_pass'
  | 'unlock_fail'
  | 'retry'
  | 'coach_on'
  | 'coach_off'
  | 'baseline_missing';

const SLOT_NAMES = ['입구', '바닥', '책상'] as const;

type LineTable = Record<CoachLinePhase, string>;
/** 페르소나별 존댓말 기본 + (반말 지원 시) 반말 일부/전체 오버라이드 */
type PersonaLines = { formal: LineTable; informal?: Partial<LineTable> };

const LINES: Record<CoachCharacterId, PersonaLines> = {
  mate: {
    formal: {
      mode_intro: '',
      slot_enter: '입구부터 갈게요. 화면이랑 겹치면 돼요.',
      align_hint: '문틀이랑 바닥선 맞춰 주세요.',
      shutter: '찍을게요— 잠깐 가만히!',
      slot_done: '좋아요, 다음으로 갈게요.',
      before_done: '세 곳 다 찍었어요. 이제 청소 리스트 봐요.',
      quest_enter: '하나씩 체크해요. 다 하면 청소 후 사진 찍어요.',
      baseline_eval: 'AI가 기준 사진 확인 중이에요. 잠깐만요.',
      baseline_pass: '기준 사진 통과! 이제 청소 시간 정해요.',
      after_score: '비교 끝났어요. 수고했어요.',
      unlock_pass: '잠금 풀렸어요! 오늘도 잘했어요.',
      unlock_fail: '점수가 조금 부족해요. 한 번 더 해볼까요?',
      retry: '괜찮아요, 다시 맞춰서 찍어요.',
      coach_on: '음성 안내 켰어요.',
      coach_off: '음성은 끄고 자막만 보여줄게요.',
      baseline_missing: '기준 사진이 없어요. 부모님이 먼저 찍어야 해요.',
    },
    informal: {
      slot_enter: '입구부터 가자. 화면이랑 겹치면 돼.',
      align_hint: '문틀이랑 바닥선 맞춰 봐.',
      shutter: '찍는다— 가만히!',
      slot_done: '좋아, 다음 가자.',
      before_done: '세 곳 다 찍었다! 이제 청소 리스트 보자.',
      quest_enter: '하나씩 체크해 봐. 다 하면 청소 후 사진 찍자.',
      baseline_eval: 'AI가 기준 사진 확인 중이야. 잠깐만!',
      baseline_pass: '기준 사진 통과! 이제 청소 시간 정하자.',
      after_score: '비교 끝! 수고했어.',
      unlock_pass: '잠금 풀렸어! 오늘도 잘했어.',
      unlock_fail: '점수가 조금 부족해. 한 번 더 해볼까?',
      retry: '괜찮아, 다시 맞춰서 찍자.',
      coach_on: '안내 켰어.',
      coach_off: '안내는 끄고 자막만 보여줄게.',
      baseline_missing: '기준 사진이 없어. 부모님이 먼저 찍어야 해.',
    },
  },
  director: {
    formal: {
      mode_intro: '',
      slot_enter: '입구부터 갑니다. 화면 가이드에 맞추세요.',
      align_hint: '문틀과 바닥선을 가이드에 맞추세요.',
      shutter: '레디, 갑니다. 잠시 고정하세요.',
      slot_done: '좋습니다. 다음으로 넘어갑니다.',
      before_done: '세 컷 확보했습니다. 청소 항목을 확인하세요.',
      quest_enter: '항목을 하나씩 처리한 뒤, 청소 후 컷을 찍습니다.',
      baseline_eval: 'AI가 기준 컷을 검수 중입니다.',
      baseline_pass: '기준 컷 안정적입니다. 청소 시간을 설정하세요.',
      after_score: '비교 완료했습니다. 수고하셨습니다.',
      unlock_pass: '기준 통과, 잠금 해제합니다.',
      unlock_fail: '통과 점수에 못 미쳤습니다. 다시 갑니다.',
      retry: '프레임 다시 잡고 갑니다.',
      coach_on: '음성 안내 켭니다.',
      coach_off: '음성 안내 끄고 자막만 표시합니다.',
      baseline_missing: '기준 컷이 없습니다. 부모님 촬영이 먼저 필요합니다.',
    },
  },
  quest: {
    formal: {
      mode_intro: '',
      slot_enter: '첫 번째 구역, 입구. 화면 가이드에 정렬하세요.',
      align_hint: '정렬도를 맞추면 클리어에 가까워집니다.',
      shutter: '카운트 갑니다. 셋, 둘, 하나!',
      slot_done: '구역 클리어! 다음 구역으로.',
      before_done: '세 구역 클리어! 청소 퀘스트를 시작합니다.',
      quest_enter: '미션을 하나씩 완료하세요. 완료하면 청소 후 촬영입니다.',
      baseline_eval: 'AI가 기준 데이터를 검사 중입니다.',
      baseline_pass: '기준 등록 완료! 다음 단계로 진행합니다.',
      after_score: '결과 산출 완료. 점수가 나왔습니다.',
      unlock_pass: '미션 성공! 잠금이 해제됩니다.',
      unlock_fail: '미션 실패. 재도전하세요.',
      retry: '재정렬 후 다시 시도하세요.',
      coach_on: '안내 음성 ON.',
      coach_off: '안내 음성 OFF, 자막만 표시합니다.',
      baseline_missing: '기준 데이터가 없습니다. 부모님 촬영이 먼저입니다.',
    },
  },
  coach: {
    formal: {
      mode_intro: '',
      slot_enter: '입구부터 갑니다. 화면에 맞추세요.',
      align_hint: '문틀, 바닥선 맞추세요.',
      shutter: '고정하고, 갑니다.',
      slot_done: '좋습니다. 다음.',
      before_done: '세 곳 완료. 청소 항목 확인하세요.',
      quest_enter: '하나씩 끝내고, 청소 후 촬영 갑니다.',
      baseline_eval: '기준 사진 검사 중입니다.',
      baseline_pass: '기준 통과. 청소 시간 설정하세요.',
      after_score: '비교 끝. 잘했습니다.',
      unlock_pass: '통과. 잠금 해제합니다.',
      unlock_fail: '점수 부족. 한 번 더 갑니다.',
      retry: '다시 맞추고 갑니다.',
      coach_on: '음성 안내 켭니다.',
      coach_off: '음성 끄고 자막만.',
      baseline_missing: '기준 사진 없습니다. 부모님 먼저.',
    },
    informal: {
      slot_enter: '입구부터 간다. 화면에 맞춰.',
      align_hint: '문틀, 바닥선 맞춰.',
      shutter: '고정하고, 간다.',
      slot_done: '좋아. 다음.',
      before_done: '세 곳 완료. 청소 항목 확인해.',
      quest_enter: '하나씩 끝내고, 청소 후 촬영 간다.',
      baseline_eval: '기준 사진 검사 중이야.',
      baseline_pass: '기준 통과. 청소 시간 정해.',
      after_score: '비교 끝. 잘했어.',
      unlock_pass: '통과. 잠금 해제.',
      unlock_fail: '점수 부족. 한 번 더 간다.',
      retry: '다시 맞추고 간다.',
      coach_on: '음성 안내 켠다.',
      coach_off: '음성 끄고 자막만.',
      baseline_missing: '기준 사진 없어. 부모님 먼저.',
    },
  },
  mentor: {
    formal: {
      mode_intro: '',
      slot_enter: '천천히 입구부터 찍어 볼게요.',
      align_hint: '문틀과 바닥선을 편하게 맞춰 주세요.',
      shutter: '준비되면 찍을게요. 편하게요.',
      slot_done: '잘했어요. 다음으로 갈게요.',
      before_done: '세 곳 다 찍었어요. 천천히 청소 항목 봐요.',
      quest_enter: '하나씩 편하게 해요. 끝나면 청소 후 사진 찍어요.',
      baseline_eval: 'AI가 기준 사진을 확인하고 있어요. 잠시만요.',
      baseline_pass: '기준 사진 잘 나왔어요. 청소 시간을 정해요.',
      after_score: '비교가 끝났어요. 수고 많았어요.',
      unlock_pass: '잠금이 풀렸어요. 오늘도 잘했어요.',
      unlock_fail: '조금 부족했어요. 천천히 다시 해봐요.',
      retry: '괜찮아요. 다시 맞춰서 찍어요.',
      coach_on: '음성 안내를 켰어요.',
      coach_off: '음성은 끄고 자막만 보여줄게요.',
      baseline_missing: '기준 사진이 아직 없어요. 부모님 촬영이 먼저예요.',
    },
  },
};

const MODE_INTRO: Record<
  CoachCharacterId,
  { formal: Record<CaptureCoachMode, string>; informal?: Record<CaptureCoachMode, string> }
> = {
  mate: {
    formal: {
      baseline: '입구, 바닥, 책상 기준 사진 세 장 찍을게요. AI가 확인해요.',
      dirty: '청소 전 사진이에요. 기준 화면에 맞춰 세 곳 찍어요.',
      after: '청소 후 사진이에요. 기준이랑 비교할게요. 세 곳 다 찍어요.',
    },
    informal: {
      baseline: '입구, 바닥, 책상 기준 사진 세 장 찍자. AI가 확인할게.',
      dirty: '청소 전 사진이야. 기준 화면 맞춰서 세 곳 찍자.',
      after: '청소 후 사진이야. 기준이랑 비교할게. 세 곳 다 찍어.',
    },
  },
  director: {
    formal: {
      baseline: '입구·바닥·책상 기준 컷 세 장을 촬영합니다. AI가 검수합니다.',
      dirty: '청소 전 컷입니다. 가이드에 맞춰 세 곳을 촬영합니다.',
      after: '청소 후 컷입니다. 기준과 비교합니다. 세 곳 모두 촬영합니다.',
    },
  },
  quest: {
    formal: {
      baseline: '기준 등록 퀘스트! 입구·바닥·책상 세 구역을 촬영합니다.',
      dirty: '청소 전 퀘스트! 세 구역을 가이드에 정렬해 촬영합니다.',
      after: '청소 후 퀘스트! 기준과 비교합니다. 세 구역 촬영하세요.',
    },
  },
  coach: {
    formal: {
      baseline: '기준 사진 세 장 갑니다. 입구부터.',
      dirty: '청소 전 세 곳, 가이드 맞춰 갑니다.',
      after: '청소 후 세 곳, 기준과 비교합니다.',
    },
    informal: {
      baseline: '기준 사진 세 장 간다. 입구부터.',
      dirty: '청소 전 세 곳, 가이드 맞춰 간다.',
      after: '청소 후 세 곳, 기준과 비교한다.',
    },
  },
  mentor: {
    formal: {
      baseline: '입구, 바닥, 책상 기준 사진을 천천히 세 장 찍어요. AI가 확인해요.',
      dirty: '청소 전 사진이에요. 편하게 기준 화면에 맞춰 세 곳 찍어요.',
      after: '청소 후 사진이에요. 기준과 비교해요. 세 곳 모두 천천히 찍어요.',
    },
  },
};

function slotName(slotIndex: number) {
  return SLOT_NAMES[slotIndex] ?? ghostSlotConfig(slotIndex).label;
}

/** 반말 요청이 와도 미지원 페르소나면 false로 폴백 (백엔드와 동일) */
function useInformal(characterId: CoachCharacterId, informal?: boolean): boolean {
  return !!informal && COACH_CHARACTERS[characterId].supportsInformal;
}

function lineFor(characterId: CoachCharacterId, phase: CoachLinePhase, informal: boolean): string {
  const persona = LINES[characterId];
  if (informal && persona.informal && persona.informal[phase] !== undefined) {
    return persona.informal[phase] as string;
  }
  return persona.formal[phase];
}

export function getCoachLine(
  characterId: CoachCharacterId,
  phase: CoachLinePhase,
  opts?: { mode?: CaptureCoachMode; slotIndex?: number; score?: number; informal?: boolean },
): string {
  const informal = useInformal(characterId, opts?.informal);

  if (phase === 'mode_intro' && opts?.mode) {
    const intro = MODE_INTRO[characterId];
    if (informal && intro.informal) return intro.informal[opts.mode];
    return intro.formal[opts.mode];
  }

  const slot = opts?.slotIndex;
  if (slot !== undefined) {
    const name = slotName(slot);
    if (phase === 'slot_enter') {
      switch (characterId) {
        case 'mate':
          return informal
            ? `${name}부터 가자. 화면이랑 겹치면 돼.`
            : `${name}부터 갈게요. 화면이랑 겹치면 돼요.`;
        case 'director':
          return `${name}부터 갑니다. 화면 가이드에 맞추세요.`;
        case 'quest':
          return `${slot + 1}번째 구역, ${name}. 화면 가이드에 정렬하세요.`;
        case 'coach':
          return informal ? `${name} 간다. 화면에 맞춰.` : `${name} 갑니다. 화면에 맞추세요.`;
        case 'mentor':
          return `천천히 ${name}부터 찍어 볼게요.`;
      }
    }
    if (phase === 'slot_done') {
      const next = SLOT_NAMES[slot + 1];
      if (!next) return lineFor(characterId, 'before_done', informal);
      switch (characterId) {
        case 'mate':
          return informal ? `${name} 끝! 다음 ${next}.` : `${name} 좋아요. 다음 ${next}.`;
        case 'director':
          return `${name} 완료. 다음은 ${next}입니다.`;
        case 'quest':
          return `${name} 클리어! 다음 구역 ${next}.`;
        case 'coach':
          return informal ? `${name} 완료. 다음 ${next}.` : `${name} 완료. 다음 ${next}입니다.`;
        case 'mentor':
          return `${name} 잘했어요. 다음은 ${next}예요.`;
      }
    }
    if (phase === 'align_hint') {
      return ghostSlotConfig(slot).ttsAlign;
    }
    if (phase === 'baseline_missing') {
      return `${name} ${lineFor(characterId, 'baseline_missing', informal)}`;
    }
  }

  if (phase === 'after_score' && opts?.score !== undefined) {
    switch (characterId) {
      case 'mate':
        return informal ? `비교 점수 ${opts.score}점! 수고했어.` : `비교 점수 ${opts.score}점이에요. 수고했어요.`;
      case 'director':
        return `비교 점수는 ${opts.score}점입니다.`;
      case 'quest':
        return `결과 ${opts.score}점! 산출 완료.`;
      case 'coach':
        return informal ? `${opts.score}점. 잘했어.` : `${opts.score}점. 잘했습니다.`;
      case 'mentor':
        return `비교 점수는 ${opts.score}점이에요. 수고 많았어요.`;
    }
  }

  return lineFor(characterId, phase, informal);
}

export function coachPausedSpeech(characterId: CoachCharacterId, informal?: boolean) {
  return getCoachLine(characterId, 'coach_off', { informal });
}

export function coachResumedSpeech(characterId: CoachCharacterId, informal?: boolean) {
  return getCoachLine(characterId, 'coach_on', { informal });
}

export function subtitlePlaceholder(hasGhost: boolean, slotIndex: number) {
  if (hasGhost) return ghostSlotConfig(slotIndex).bottomCue;
  return '안내가 여기에 표시됩니다';
}
