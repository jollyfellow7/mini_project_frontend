'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CleaningCalendar } from '@/components/chungsora/CleaningCalendar';
import { WON_PER_P } from '@/lib/chungsora/tokens';
import { fetchFamilySummary, fetchDailyQuests, type FamilySummary, type DailyQuest } from '@/lib/chungsora/clientApi';
import { useCleaningSessionStore } from '@/lib/chungsora/cleaningSessionStore';
import { postToNative } from '@/lib/chungsora/nativeBridge';

export default function ChildHomePage() {
  const router = useRouter();
  const [summary, setSummary] = useState<FamilySummary | null>(null);
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const phase = useCleaningSessionStore((s) => s.phase);
  const setPhase = useCleaningSessionStore((s) => s.setPhase);
  const inMission = phase !== 'idle' && phase !== 'unlock';

  useEffect(() => {
    void fetchFamilySummary()
      .then((s) => setSummary(s))
      .catch(() => undefined);
    void fetchDailyQuests()
      .then((r) => setQuests(r.quests))
      .catch(() => undefined);
  }, []);

  const name = summary?.child_display_name ?? '자녀';
  const points = summary?.points_balance ?? 0;
  const streak = summary?.streak_days ?? 0;
  const mult = summary?.streak_mult ?? 1;

  return (
    <>
      <header className="flex items-center justify-between px-5 pb-2 pt-4">
        <h1 className="text-[22px] font-bold text-[#2f3438]">안녕, {name}</h1>
        <span className="text-sm font-bold text-[#00b8cf]">
          {points}P · ≈{(points * WON_PER_P).toLocaleString()}원
        </span>
      </header>

      <div className="flex flex-col gap-4 px-5 pb-6">
        <div className="ch-card p-4">
          <p className="text-sm font-medium text-[#2f3438]">
            {summary?.today_score ? '오늘 청소 완료' : '오늘 청소 대기'}
          </p>
          <p className="mt-1 text-xs text-[#8e8e8e]">
            연속 {streak}일 · 보상 {mult}×
          </p>
        </div>

        {quests.length > 0 && (
          <div className="ch-card p-4">
            <p className="text-sm font-bold text-[#2f3438]">오늘의 일일 퀘스트</p>
            <ul className="mt-2 space-y-1">
              {quests.map((q) => (
                <li key={q.id} className="text-xs text-[#828c94]">
                  · {q.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        {inMission ? (
          <button
            type="button"
            onClick={() => router.push('/child/mission/quest')}
            className="ch-btn-primary block py-4 text-center text-[15px]"
          >
            미션 이어하기
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setPhase('dirty');
              postToNative('missionStart');
              router.push('/child/mission/before');
            }}
            className="ch-btn-primary block py-4 text-center text-[15px]"
          >
            오늘 방 청소 미션
          </button>
        )}

        <div className="border-t border-[#eaedef] pt-4">
          <h2 className="mb-3 text-sm font-bold text-[#2f3438]">청소 로그</h2>
          <CleaningCalendar role="child" points={points} />
        </div>
      </div>
    </>
  );
}
