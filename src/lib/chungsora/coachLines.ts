import { ghostSlotConfig } from '@/lib/chungsora/ghostSlots';
import type { CoachCharacterId } from '@/lib/chungsora/coachCharacters';

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

const LINES: Record<CoachCharacterId, LineTable> = {
  jiu: {
    mode_intro: '',
    slot_enter: '입구부터 가자. 화면이랑 겹치면 돼.',
    align_hint: '문 틀이랑 바닥선 맞춰 봐.',
    shutter: '찍는다— 가만히!',
    slot_done: '끝! 다음으로 가자.',
    before_done: '세 곳 다 찍었다! 이제 청소 리스트 보자.',
    quest_enter: '하나씩 체크해 봐. 다 하면 청소 후 사진 찍자.',
    baseline_eval: 'AI가 기준 사진 검사 중이야. 잠깐만!',
    baseline_pass: '기준 사진 통과! 이제 청소 시간 정하자.',
    after_score: '비교 끝! 수고했어.',
    unlock_pass: '잠금 풀렸어! 오늘도 잘했어.',
    unlock_fail: '점수가 조금 부족해. 한 번 더 해볼까?',
    retry: '괜찮아, 다시 맞춰서 찍어보자.',
    coach_on: '안내 켰어.',
    coach_off: '안내는 껐어. 글자만 보여줄게.',
    baseline_missing: '기준 사진이 없어. 부모님이 먼저 찍어야 해.',
  },
  seoyeon: {
    mode_intro: '',
    slot_enter: '먼저 입구 사진을 찍어 주세요.',
    align_hint: '기준 화면과 문틀·바닥 경계를 맞춰 주세요.',
    shutter: '지금 촬영합니다. 잠시 가만히 있어 주세요.',
    slot_done: '촬영이 완료되었습니다. 다음으로 이동합니다.',
    before_done: '세 곳 촬영이 끝났습니다. 청소 항목을 확인해 주세요.',
    quest_enter: '항목을 하나씩 완료한 뒤, 청소 후 사진을 찍어 주세요.',
    baseline_eval: 'AI가 기준 사진을 검사하고 있습니다.',
    baseline_pass: '기준 사진이 확인되었습니다. 청소 시간을 설정해 주세요.',
    after_score: '비교가 끝났습니다. 수고하셨습니다.',
    unlock_pass: '잠금이 해제되었습니다.',
    unlock_fail: '통과 점수에 도달하지 못했습니다. 다시 시도해 주세요.',
    retry: '다시 맞춰서 촬영해 주세요.',
    coach_on: '음성 안내를 켰습니다.',
    coach_off: '음성 안내를 껐습니다. 자막만 표시됩니다.',
    baseline_missing: '기준 사진이 없습니다. 부모님 촬영이 필요합니다.',
  },
  hajun: {
    mode_intro: '',
    slot_enter: '1번째! 화면 맞춰 보자!',
    align_hint: '화면 맞추면 성공에 가까워져!',
    shutter: '지금 찍어— 3, 2, 1!',
    slot_done: '클리어! 다음 가보자!',
    before_done: 'Before 3/3 완료! 이제 청소 타임!',
    quest_enter: '체크 하나씩! 다 하면 After 사진 가자!',
    baseline_eval: 'AI 검사 중— 조금만 기다려!',
    baseline_pass: '기준 사진 OK! 다음 단계로!',
    after_score: '점수 나왔어! 최고야!',
    unlock_pass: '잠금 해제! 오늘 미션 성공!',
    unlock_fail: '아쉽다— 한 번 더 도전!',
    retry: '다시 맞춰 보면 돼, 화이팅!',
    coach_on: '응원 모드 ON!',
    coach_off: '응원은 글자로만 보여줄게.',
    baseline_missing: '기준 사진이 아직 없어. 부모님 먼저!',
  },
};

const MODE_INTRO: Record<CoachCharacterId, Record<CaptureCoachMode, string>> = {
  jiu: {
    baseline: '입구, 바닥, 책상 기준 사진 세 장 찍자. AI가 괜찮은지 볼게.',
    dirty: '청소 전 사진이야. 부모님 기준 화면이랑 맞춰서 세 곳 찍자.',
    after: '청소 후 사진이야. 기준이랑 비교할게. 세 곳 다 찍어.',
  },
  seoyeon: {
    baseline: '입구, 바닥, 책상의 기준 사진을 촬영해 주세요. AI가 확인합니다.',
    dirty: '청소 전 사진입니다. 기준 화면에 맞춰 세 곳을 촬영해 주세요.',
    after: '청소 후 사진입니다. 기준과 비교합니다. 세 곳 모두 촬영해 주세요.',
  },
  hajun: {
    baseline: '기준 사진 3장 미션! 입구부터 가보자!',
    dirty: '청소 전 3장! 기준 화면 맞추고 찍자!',
    after: '청소 후 3장! 기준이랑 비교할 거야!',
  },
};

function slotName(slotIndex: number) {
  return SLOT_NAMES[slotIndex] ?? ghostSlotConfig(slotIndex).label;
}

export function getCoachLine(
  characterId: CoachCharacterId,
  phase: CoachLinePhase,
  opts?: { mode?: CaptureCoachMode; slotIndex?: number; score?: number },
): string {
  if (phase === 'mode_intro' && opts?.mode) {
    return MODE_INTRO[characterId][opts.mode];
  }
  const line = LINES[characterId][phase];
  const slot = opts?.slotIndex;
  if (slot !== undefined) {
    const name = slotName(slot);
    if (phase === 'slot_enter') {
      if (characterId === 'jiu') return `${name}부터 가자. 화면이랑 겹치면 돼.`;
      if (characterId === 'seoyeon') return `먼저 ${name} 사진을 찍어 주세요.`;
      return `${slot + 1}번째 ${name}! 화면 맞춰 보자!`;
    }
    if (phase === 'slot_done') {
      const next = SLOT_NAMES[slot + 1];
      if (!next) return LINES[characterId].before_done;
      if (characterId === 'jiu') return `${name} 끝! 다음 ${next}!`;
      if (characterId === 'seoyeon') return `${name} 완료입니다. 이제 ${next}입니다.`;
      return `${name} 클리어! 다음 ${next}!`;
    }
    if (phase === 'align_hint') {
      return ghostSlotConfig(slot).ttsAlign;
    }
    if (phase === 'baseline_missing') {
      return `${name} ${LINES[characterId].baseline_missing}`;
    }
  }
  if (phase === 'after_score' && opts?.score !== undefined) {
    if (characterId === 'jiu') return `비교 점수 ${opts.score}점! 수고했어.`;
    if (characterId === 'seoyeon') return `비교 점수는 ${opts.score}점입니다.`;
    return `${opts.score}점! 대단해!`;
  }
  return line;
}

export function coachPausedSpeech(characterId: CoachCharacterId) {
  return getCoachLine(characterId, 'coach_off');
}

export function coachResumedSpeech(characterId: CoachCharacterId) {
  return getCoachLine(characterId, 'coach_on');
}

export function subtitlePlaceholder(hasGhost: boolean, slotIndex: number) {
  if (hasGhost) return ghostSlotConfig(slotIndex).bottomCue;
  return '안내가 여기에 표시됩니다';
}
