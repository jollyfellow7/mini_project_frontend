'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { CoachAvatar } from '@/components/chungsora/CoachAvatar';
import {
  COACH_CHARACTER_IDS,
  COACH_CHARACTERS,
  coachIntroSample,
  type CoachCharacterId,
} from '@/lib/chungsora/coachCharacters';
import { getCoachLine } from '@/lib/chungsora/coachLines';
import { primeSpeechSynthesis } from '@/lib/chungsora/useCoachSpeech';

type CoachCharacterPickerProps = {
  value: CoachCharacterId;
  onChange: (id: CoachCharacterId) => void;
  informal?: boolean;
  onInformalChange?: (v: boolean) => void;
  /**
   * true 이면 "미션 진행 중" 상태 - 카드 클릭 소개 팝업은 허용하되
   * 확정 시 큐에 저장, 미션 종료 후(false로 바뀌는 시점) 자동으로 onChange 실행
   */
  disabled?: boolean;
  title?: string;
  /** 자녀 나이 - 추천 배지 표시용 (선택) */
  childAge?: number | null;
};

// 음성 캐시 (모듈 레벨 - 컴포넌트 언마운트 후에도 유지)
let voiceCache: SpeechSynthesisVoice[] = [];
let voiceCacheInitialized = false;

function initVoiceCache() {
  if (voiceCacheInitialized || typeof window === 'undefined' || !window.speechSynthesis) return;
  voiceCacheInitialized = true;

  const update = () => {
    voiceCache = window.speechSynthesis.getVoices();
  };

  update();
  window.speechSynthesis.addEventListener('voiceschanged', update);
  primeSpeechSynthesis();
}

function pickKoVoice(): SpeechSynthesisVoice | undefined {
  const pool = voiceCache.length > 0 ? voiceCache : window.speechSynthesis.getVoices();
  const ko = pool.filter((v) => v.lang.toLowerCase().startsWith('ko'));
  return (
    ko.find((v) => v.localService) ??
    ko.find((v) => /yuna|heera|nara|google|microsoft/i.test(v.name)) ??
    ko[0]
  );
}

function speakDirect(text: string, rate = 0.95) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const trimmed = text.trim();
  if (!trimmed) return;

  const synth = window.speechSynthesis;
  if (synth.paused) synth.resume();
  if (synth.speaking || synth.pending) synth.cancel();

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = 'ko-KR';
  utterance.rate = rate;
  utterance.volume = 1;
  utterance.pitch = 1;

  const voice = pickKoVoice();
  if (voice) utterance.voice = voice;

  synth.speak(utterance);
}

export function CoachCharacterPicker({
  value,
  onChange,
  informal = false,
  onInformalChange,
  disabled = false,
  title = '아이에게 들려줄 안내 친구',
  childAge = null,
}: CoachCharacterPickerProps) {
  const canUsePortal = typeof document !== 'undefined';
  const [detailId, setDetailId] = useState<CoachCharacterId | null>(null);
  const [queuedId, setQueuedId] = useState<CoachCharacterId | null>(null);
  const [toastName, setToastName] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prevDisabled = useRef(disabled);

  useEffect(() => {
    initVoiceCache();
    if (!canUsePortal) return;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setDetailId(null);
        setToastName(null);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [canUsePortal]);

  useEffect(() => {
    if (prevDisabled.current && !disabled && queuedId !== null) {
      onChange(queuedId);
      setQueuedId(null);
    }
    prevDisabled.current = disabled;
  }, [disabled, queuedId, onChange]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (name: string, queued = false) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastName(queued ? `${name} (미션 후 적용)` : name);
    toastTimerRef.current = setTimeout(() => setToastName(null), 5000);
  };

  const selectedMeta = COACH_CHARACTERS[value];
  const informalSupported = selectedMeta.supportsInformal;
  const effectiveInformal = informal && informalSupported;

  const detail = detailId ? COACH_CHARACTERS[detailId] : null;
  const pendingId = disabled ? queuedId : null;

  const handleConfirm = (id: CoachCharacterId) => {
    setDetailId(null);
    if (disabled) {
      setQueuedId(id);
      showToast(COACH_CHARACTERS[id].name, true);
      return;
    }

    onChange(id);
    setQueuedId(null);
    showToast(COACH_CHARACTERS[id].name, false);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-[#1a1e22]">{title}</p>

      {disabled && (
        <p className="rounded-lg bg-[#fff8e6] px-3 py-2 text-xs text-[#b45309]">
          미션 진행 중이라 지금은 즉시 변경되지 않고 미션 완료 후 적용됩니다.
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {COACH_CHARACTER_IDS.map((id) => {
          const coach = COACH_CHARACTERS[id];
          const isCurrent = value === id;
          const isPending = pendingId === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setDetailId(id)}
              className={[
                'ch-card relative flex w-full flex-col items-center gap-2 p-3',
                'transition active:scale-[0.96] active:brightness-95',
                isCurrent && !isPending ? 'ring-2 ring-[#00b8cf]' : '',
                isPending ? 'ring-2 ring-[#f59e0b]' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {childAge != null && coach.recommendedAges.includes(childAge) && (
                <span className="absolute right-1 top-1 rounded-full bg-[#e6f9fc] px-1.5 py-0.5 text-[8px] font-bold text-[#00a3b8]">
                  추천
                </span>
              )}
              {isCurrent && !isPending && (
                <span className="absolute left-1 top-1 rounded-full bg-[#00b8cf] px-1.5 py-0.5 text-[8px] font-bold text-white">
                  사용 중
                </span>
              )}
              {isPending && (
                <span className="absolute left-1 top-1 rounded-full bg-[#f59e0b] px-1.5 py-0.5 text-[8px] font-bold text-white">
                  대기 중
                </span>
              )}
              <CoachAvatar characterId={id} size="lg" selected={isCurrent && !isPending} />
              <span className="text-xs font-bold text-[#1a1e22]">{coach.name}</span>
              <span className="text-center text-[10px] leading-tight text-[#8e8e8e]">{coach.toneLabel}</span>
            </button>
          );
        })}
      </div>

      {onInformalChange && (
        <div
          className={`flex items-center justify-between rounded-xl border border-[#eef0f2] px-3 py-2.5 ${
            informalSupported ? '' : 'opacity-50'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#1a1e22]">반말 모드</span>
            <span className="text-[10px] text-[#8e8e8e]">
              {informalSupported
                ? '현재 안내 친구가 반말 모드를 지원해요.'
                : '현재 안내 친구는 존댓말만 지원해요.'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={effectiveInformal}
            aria-label="반말 모드"
            disabled={disabled || !informalSupported}
            onClick={() => onInformalChange(!effectiveInformal)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${
              effectiveInformal ? 'bg-[#00b8cf]' : 'bg-[#d8dde1]'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                effectiveInformal ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => speakDirect(coachIntroSample(value, effectiveInformal), selectedMeta.ttsRate)}
        className="w-full rounded-xl border-2 border-[#00b8cf] py-3 text-sm font-bold text-[#00b8cf] transition active:bg-[#e6f9fc]"
      >
        미리 들어보기
      </button>

      {canUsePortal &&
        detail &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coach-detail-title"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDetailId(null);
            }}
          >
            <div className="ch-card w-full max-w-sm p-5" onMouseDown={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <CoachAvatar characterId={detail.id} size="lg" />
                <div>
                  <h2 id="coach-detail-title" className="text-base font-bold text-[#1a1e22]">
                    {detail.name} 안내를 사용할까요?
                  </h2>
                  <p className="text-xs text-[#8e8e8e]">{detail.toneLabel}</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-[#1a1e22]">
                <span className="font-semibold">이런 말투예요</span>
                <br />
                {coachIntroSample(detail.id, informal && detail.supportsInformal)}
              </p>
              <p className="mt-3 text-xs text-[#8e8e8e]">
                <span className="font-semibold text-[#1a1e22]">이런 아이에게 잘 맞아요</span>
                <br />
                {detail.goodFor}
              </p>
              {!detail.supportsInformal && (
                <p className="mt-2 text-[11px] text-[#adb5bd]">존댓말만 지원하는 안내 친구예요.</p>
              )}
              <p className="mt-3 rounded-lg bg-[#f7f9fa] px-3 py-2 text-xs text-[#6b7280]">
                {getCoachLine(detail.id, 'slot_enter', { slotIndex: 0 })}
              </p>

              <button
                type="button"
                onClick={() =>
                  speakDirect(coachIntroSample(detail.id, informal && detail.supportsInformal), detail.ttsRate)
                }
                className="mt-3 w-full rounded-xl border-2 border-[#00b8cf] py-2.5 text-sm font-bold text-[#00b8cf] transition active:bg-[#e6f9fc]"
              >
                미리 들어보기
              </button>

              {disabled && (
                <p className="mt-2 rounded-lg bg-[#fff8e6] px-3 py-2 text-xs text-[#b45309]">
                  지금은 미션 진행 중이라 선택해 두면 미션 완료 후 자동 적용됩니다.
                </p>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="ch-btn-primary flex-1 py-3 text-sm"
                  onClick={() => handleConfirm(detail.id)}
                >
                  {disabled ? '미션 후 이 친구로 바꾸기' : '이 안내 친구로 바꾸기'}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-[#dbdbdb] py-3 text-sm text-[#1a1e22]"
                  onClick={() => setDetailId(null)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {canUsePortal &&
        toastName &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setToastName(null);
            }}
          >
            <div className="ch-card w-full max-w-xs p-6 text-center" onMouseDown={(e) => e.stopPropagation()}>
              <p className="text-base font-bold text-[#1a1e22]">설정 완료</p>
              <p className="mt-2 text-sm text-[#8e8e8e]">
                <span className="font-semibold text-[#00b8cf]">{toastName}</span>
              </p>
              <button
                type="button"
                onClick={() => setToastName(null)}
                className="ch-btn-primary mt-5 w-full py-3 text-sm"
              >
                확인
              </button>
              <p className="mt-2 text-[10px] text-[#adb5bd]">5초 후 자동으로 닫힙니다.</p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
