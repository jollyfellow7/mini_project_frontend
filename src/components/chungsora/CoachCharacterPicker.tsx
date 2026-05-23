'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CoachAvatar } from '@/components/chungsora/CoachAvatar';
import {
  COACH_CHARACTER_IDS,
  COACH_CHARACTERS,
  coachIntroSample,
  type CoachCharacterId,
} from '@/lib/chungsora/coachCharacters';
import { getCoachLine } from '@/lib/chungsora/coachLines';

type CoachCharacterPickerProps = {
  value: CoachCharacterId;
  onChange: (id: CoachCharacterId) => void;
  /** 반말 모드 (지원 페르소나만) */
  informal?: boolean;
  onInformalChange?: (v: boolean) => void;
  disabled?: boolean;
  title?: string;
  /** 자녀 나이 — 추천 배지 표시용 (선택) */
  childAge?: number | null;
};

/** Web Speech API 직접 호출 — user gesture 컨텍스트 유지를 위해 setTimeout 없이 실행 */
function speakDirect(text: string, rate = 0.95) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.trim());
  u.lang = 'ko-KR';
  u.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  const ko = voices.filter((v) => v.lang.toLowerCase().startsWith('ko'));
  const voice = ko.find((v) => v.localService) ?? ko.find((v) => /yuna|heera|nara|google|microsoft/i.test(v.name)) ?? ko[0];
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
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
  const [detailId, setDetailId] = useState<CoachCharacterId | null>(null);
  // 설정 완료 토스트
  const [toastName, setToastName] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((name: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastName(name);
    toastTimerRef.current = setTimeout(() => setToastName(null), 5000);
  }, []);

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const selectedMeta = COACH_CHARACTERS[value];
  const informalSupported = selectedMeta.supportsInformal;
  const effectiveInformal = informal && informalSupported;

  const detail = detailId ? COACH_CHARACTERS[detailId] : null;

  const handleConfirm = (id: CoachCharacterId) => {
    onChange(id);
    setDetailId(null);
    showToast(COACH_CHARACTERS[id].name);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-[#1a1e22]">{title}</p>

      {/* 페르소나 카드 — 카드 전체 클릭 시 소개 팝업 */}
      <div className="grid grid-cols-3 gap-2">
        {COACH_CHARACTER_IDS.map((id) => {
          const c = COACH_CHARACTERS[id];
          const on = value === id;
          const recommended = childAge != null && c.recommendedAges.includes(childAge);
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => setDetailId(id)}
              className={`ch-card relative flex w-full flex-col items-center gap-2 p-3 transition ${on ? 'ring-2 ring-[#00b8cf]' : ''} ${disabled ? 'opacity-50' : ''}`}
            >
              {recommended && (
                <span className="absolute right-1 top-1 rounded-full bg-[#e6f9fc] px-1.5 py-0.5 text-[8px] font-bold text-[#00a3b8]">
                  추천
                </span>
              )}
              {on && (
                <span className="absolute left-1 top-1 rounded-full bg-[#00b8cf] px-1.5 py-0.5 text-[8px] font-bold text-white">
                  사용 중
                </span>
              )}
              <CoachAvatar characterId={id} size="lg" selected={on} />
              <span className="text-xs font-bold text-[#1a1e22]">{c.name}</span>
              <span className="text-center text-[10px] leading-tight text-[#8e8e8e]">{c.toneLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 반말 모드 토글 — 미지원 페르소나는 비활성(grey out) */}
      {onInformalChange && (
        <div
          className={`flex items-center justify-between rounded-xl border border-[#eef0f2] px-3 py-2.5 ${informalSupported ? '' : 'opacity-50'}`}
        >
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#1a1e22]">반말 모드</span>
            <span className="text-[10px] text-[#8e8e8e]">
              {informalSupported
                ? '안내 친구가 편하게 반말로 말해요.'
                : '이 안내 친구는 존댓말만 지원해요.'}
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

      {/* 미리 들어보기 — user gesture 컨텍스트 유지를 위해 직접 호출 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const meta = COACH_CHARACTERS[value];
          speakDirect(coachIntroSample(value, effectiveInformal), meta.ttsRate);
        }}
        className="w-full rounded-xl border-2 border-[#00b8cf] py-3 text-sm font-bold text-[#00b8cf] transition active:bg-[#e6f9fc] disabled:opacity-40"
      >
        ▶ 미리 들어보기
      </button>

      {/* 소개 팝업 — 카드 클릭 시 표시 (Portal로 body에 직접 렌더) */}
      {detail && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coach-detail-title"
          onClick={(e) => { if (e.target === e.currentTarget) setDetailId(null); }}
        >
          <div
            className="ch-card w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <CoachAvatar characterId={detail.id} size="lg" />
              <div>
                <h2 id="coach-detail-title" className="text-base font-bold text-[#1a1e22]">
                  {detail.name}은 어떤 안내를 해요?
                </h2>
                <p className="text-xs text-[#8e8e8e]">{detail.toneLabel}</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-[#1a1e22]">
              <span className="font-semibold">이런 말투예요</span>
              <br />
              {coachIntroSample(detail.id, informal)}
            </p>
            <p className="mt-3 text-xs text-[#8e8e8e]">
              <span className="font-semibold text-[#1a1e22]">이런 아이에게 좋아요</span>
              <br />
              {detail.goodFor}
            </p>
            {!detail.supportsInformal && (
              <p className="mt-2 text-[11px] text-[#adb5bd]">존댓말 전용 안내 친구예요.</p>
            )}
            <p className="mt-3 rounded-lg bg-[#f7f9fa] px-3 py-2 text-xs text-[#6b7280]">
              {getCoachLine(detail.id, 'slot_enter', { slotIndex: 0 })}
            </p>

            {/* 미리 들어보기 (팝업 내) */}
            <button
              type="button"
              onClick={() => speakDirect(coachIntroSample(detail.id, informal), detail.ttsRate)}
              className="mt-3 w-full rounded-xl border-2 border-[#00b8cf] py-2.5 text-sm font-bold text-[#00b8cf] transition active:bg-[#e6f9fc]"
            >
              ▶ 미리 들어보기
            </button>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="ch-btn-primary flex-1 py-3 text-sm"
                disabled={disabled}
                onClick={() => handleConfirm(detail.id)}
              >
                이 안내 친구로 할게요
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
        </div>
      )}

      {/* 설정 완료 토스트 팝업 */}
      {toastName && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="ch-card w-full max-w-xs p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-bold text-[#1a1e22]">설정 완료되었습니다</p>
            <p className="mt-2 text-sm text-[#8e8e8e]">
              <span className="font-semibold text-[#00b8cf]">{toastName}</span>으로 변경됐어요.
            </p>
            <button
              type="button"
              onClick={() => setToastName(null)}
              className="ch-btn-primary mt-5 w-full py-3 text-sm"
            >
              확인
            </button>
            <p className="mt-2 text-[10px] text-[#adb5bd]">5초 후 자동으로 닫혀요</p>
          </div>
        </div>
      )}
    </div>
  );
}
