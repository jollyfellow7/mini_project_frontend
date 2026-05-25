'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CleaningCalendar } from '@/components/chungsora/CleaningCalendar';
import { wonToP } from '@/lib/chungsora/tokens';
import { fetchFamilySummary, type FamilySummary } from '@/lib/chungsora/clientApi';
import { Plus } from 'lucide-react';

function streakStyle(mult: number): { bg: string; text: string; icon: string } {
  if (mult >= 2) return { bg: 'bg-[#fff0f0]', text: 'text-[#e03131]', icon: '🔥' };
  if (mult >= 1.5) return { bg: 'bg-[#fff4e6]', text: 'text-[#e07b00]', icon: '🔥' };
  if (mult >= 1.25) return { bg: 'bg-[#fffbe6]', text: 'text-[#b08900]', icon: '⚡' };
  return { bg: 'bg-[#f0f2f4]', text: 'text-[#828c94]', icon: '' };
}

export default function ParentHomePage() {
  const router = useRouter();
  const [summary, setSummary] = useState<FamilySummary | null>(null);

  useEffect(() => {
    void fetchFamilySummary().then(setSummary).catch(() => undefined);
  }, []);

  const lockTime = summary?.lock_time ?? '17:00';
  const lockDays = summary?.lock_days ?? '월·수·금';
  const baseCleanWon = summary?.base_clean_won ?? 1000;
  const points = summary?.points_balance ?? 0;
  const childName = summary?.child_display_name ?? '자녀';
  const streak = summary?.streak_days ?? 0;
  const streakMult = summary?.streak_mult ?? 1;
  const todayDone = Boolean(summary?.today_score);
  const baselineVerified = Boolean(summary?.baseline_verified);
  const sc = streakStyle(streakMult);

  return (
    <div className="flex flex-col bg-[#f7f9fa] pb-8">
      <header className="flex items-center justify-between px-5 pb-3 pt-5">
        <h1 className="text-[22px] font-bold tracking-[-0.3px] text-[#1a1e22]">청소해라</h1>
        <span className="rounded-full bg-[#fff4e6] px-3 py-1.5 text-[12px] font-bold text-[#e07b00]">
          {lockTime} 잠금
        </span>
      </header>

      <div className="flex flex-col gap-5 px-5">
        {!baselineVerified ? (
          <button
            type="button"
            onClick={() => router.push('/parent/onboard/baseline')}
            className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-800"
          >
            ⚠️ 기준 사진이 아직 등록되지 않았어요. 기준 사진을 촬영해 주세요.
          </button>
        ) : null}

        <div className="ch-card overflow-hidden">
          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <div>
              <p className="mt-0.5 text-[20px] font-bold tracking-[-0.3px] text-[#1a1e22]">{childName}</p>
            </div>
            <span
              className={[
                'rounded-full px-3 py-1 text-[12px] font-semibold',
                todayDone ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#f0f2f4] text-[#828c94]',
              ].join(' ')}
            >
              {todayDone ? '✓ 완료' : '대기 중'}
            </span>
          </div>

          <div className="mx-5 h-px bg-[#f0f2f4]" />

          <div className="grid grid-cols-3 divide-x divide-[#f0f2f4]">
            <div className="flex flex-col items-center py-3.5 gap-0.5">
              <p className="text-[11px] font-medium text-[#adb5bd]">잔여 포인트</p>
              <p className="text-[16px] font-bold text-[#1a1e22]">{points.toLocaleString()}P</p>
            </div>
            <div className="flex flex-col items-center gap-0.5 py-3.5">
              <p className="text-[11px] font-medium text-[#adb5bd]">스트릭</p>
              <p className="text-[16px] font-bold text-[#1a1e22]">{streak}일 연속</p>
            </div>
            <div className="flex flex-col items-center gap-0.5 py-3.5">
              <p className="text-[11px] font-medium text-[#adb5bd]">보상 배율</p>
              <p className={['text-[16px] font-bold', streakMult > 1 ? sc.text : 'text-[#1a1e22]'].join(' ')}>
                {sc.icon ? `${sc.icon} ` : ''}
                {streakMult}×
              </p>
            </div>
          </div>

          {streakMult > 1 ? (
            <div className={['mx-4 mb-4 mt-1 rounded-xl px-3.5 py-2.5', sc.bg].join(' ')}>
              <p className={['text-[12px] font-semibold', sc.text].join(' ')}>
                {sc.icon} {streak}일 연속 달성 — {streakMult}× 배율 적용 중
                {streakMult < 2 ? (
                  <span className="ml-1 font-normal opacity-70">({14 - streak}일 더 하면 2×)</span>
                ) : null}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-center text-[12px] text-[#adb5bd]">잠금 스케줄 · {lockDays} {lockTime}</p>
          <button
            type="button"
            onClick={() => router.push('/parent/rewards?addQuest=1')}
            className="ch-btn-primary flex w-full items-center justify-center gap-2 py-4 text-[15px] font-bold"
          >
            <Plus size={18} />
            일일 퀘스트 추가하기
          </button>
        </div>

        <div className="ch-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[14px] font-bold text-[#1a1e22]">청소 로그</p>
            <button
              type="button"
              onClick={() => router.push('/log')}
              className="text-[12px] font-medium text-[#00b8cf]"
            >
              전체 보기 →
            </button>
          </div>
          <CleaningCalendar role="parent" points={points} />
        </div>

        <div className="rounded-xl bg-[#f0f2f4] px-4 py-3">
          <p className="text-[12px] leading-relaxed text-[#828c94]">
            청소 1회 기본 <span className="font-bold text-[#2f3438]">{baseCleanWon.toLocaleString()}원</span> ·
            AI 점수%만큼 지급 · 예: 90점 →{' '}
            <span className="font-bold text-[#2f3438]">{wonToP(Math.floor(baseCleanWon * 0.9))}P</span>
          </p>
        </div>
      </div>
    </div>
  );
}
