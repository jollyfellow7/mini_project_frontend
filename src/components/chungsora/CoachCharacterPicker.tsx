'use client';

import { useCallback, useState } from 'react';
import { Info } from 'lucide-react';
import { CoachAvatar } from '@/components/chungsora/CoachAvatar';
import {
  COACH_CHARACTER_IDS,
  COACH_CHARACTERS,
  coachIntroSample,
  type CoachCharacterId,
} from '@/lib/chungsora/coachCharacters';
import { getCoachLine } from '@/lib/chungsora/coachLines';
import { useCoachSpeech } from '@/lib/chungsora/useCoachSpeech';

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
  const { speak } = useCoachSpeech(true);

  const selectedMeta = COACH_CHARACTERS[value];
  const informalSupported = selectedMeta.supportsInformal;
  const effectiveInformal = informal && informalSupported;

  const preview = useCallback(
    (id: CoachCharacterId) => {
      const meta = COACH_CHARACTERS[id];
      speak(coachIntroSample(id, effectiveInformal), { rate: meta.ttsRate });
    },
    [speak, effectiveInformal],
  );

  const detail = detailId ? COACH_CHARACTERS[detailId] : null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-[#1a1e22]">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        {COACH_CHARACTER_IDS.map((id) => {
          const c = COACH_CHARACTERS[id];
          const on = value === id;
          const recommended =
            childAge != null && c.recommendedAges.includes(childAge);
          return (
            <div key={id} className="flex flex-col items-center gap-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(id)}
                className={`ch-card relative flex w-full flex-col items-center gap-2 p-3 transition ${on ? 'ring-2 ring-[#00b8cf]' : ''} ${disabled ? 'opacity-50' : ''}`}
              >
                {recommended && (
                  <span className="absolute right-1 top-1 rounded-full bg-[#e6f9fc] px-1.5 py-0.5 text-[8px] font-bold text-[#00a3b8]">
                    추천
                  </span>
                )}
                <CoachAvatar characterId={id} size="lg" selected={on} />
                <span className="text-xs font-bold text-[#1a1e22]">{c.name}</span>
                <span className="text-center text-[10px] leading-tight text-[#8e8e8e]">{c.toneLabel}</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-0.5 text-[10px] text-[#8e8e8e]"
                onClick={() => setDetailId(id)}
              >
                <Info className="h-3 w-3" aria-hidden />
                소개
              </button>
            </div>
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

      <button
        type="button"
        disabled={disabled}
        onClick={() => preview(value)}
        className="text-xs font-semibold text-[#00b8cf]"
      >
        미리 들어보기
      </button>

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-labelledby="coach-detail-title"
        >
          <div className="ch-card w-full max-w-sm p-5">
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
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="ch-btn-primary flex-1 py-3 text-sm"
                disabled={disabled}
                onClick={() => {
                  onChange(detail.id);
                  setDetailId(null);
                }}
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
    </div>
  );
}
