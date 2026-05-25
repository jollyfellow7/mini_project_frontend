'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RoleShell } from '@/components/chungsora/RoleShell';
import { CleaningLogView } from '@/components/chungsora/CleaningLogView';
import {
  fetchChildProposals,
  fetchDailyQuests,
  fetchLogCalendar,
  fetchShopRewards,
} from '@/lib/chungsora/clientApi';

type LogKind = 'cleaning' | 'propose' | 'quest' | 'reward';

type LogItem = {
  type: LogKind;
  date: string;
  score?: number;
  label?: string;
};

function normalizeCalendarDate(item: unknown): { date: string; score: number } | null {
  if (typeof item === 'string') {
    return /^\d{4}-\d{2}-\d{2}$/.test(item) ? { date: item, score: 0 } : null;
  }
  if (!item || typeof item !== 'object') return null;
  const rec = item as Record<string, unknown>;
  const dateRaw = rec.date ?? rec.log_date ?? rec.ymd;
  if (typeof dateRaw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) return null;
  const score = typeof rec.score === 'number' ? rec.score : 0;
  return { date: dateRaw, score };
}

function LogList({ onSelect }: { onSelect: (date: string) => void }) {
  const [filter, setFilter] = useState<'all' | LogKind>('all');
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    void Promise.allSettled([
      fetchLogCalendar(now.getFullYear(), now.getMonth() + 1),
      fetchChildProposals(),
      fetchDailyQuests(),
      fetchShopRewards(),
    ])
      .then(([calendarRes, proposalsRes, questsRes, rewardsRes]) => {
        const calendar = calendarRes.status === 'fulfilled' ? calendarRes.value : { dates: [], points: 0, year_month: '' };
        const proposals = proposalsRes.status === 'fulfilled' ? proposalsRes.value : { threads: [] as Array<{ updatedAt?: string; label?: string }> };
        const quests = questsRes.status === 'fulfilled' ? questsRes.value : { quests: [] as Array<{ title: string }> };
        const rewards = rewardsRes.status === 'fulfilled' ? rewardsRes.value : { rewards: [] as Array<{ label: string }> };

        const cleaning: LogItem[] = (calendar.dates ?? [])
          .map(normalizeCalendarDate)
          .filter((v): v is { date: string; score: number } => !!v)
          .map((v) => ({ type: 'cleaning', date: v.date, score: v.score }));

        const propose: LogItem[] = (proposals.threads ?? []).reduce<LogItem[]>((acc, t) => {
          const date = typeof t.updatedAt === 'string' ? t.updatedAt.slice(0, 10) : '';
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return acc;
          acc.push({ type: 'propose', date, label: t.label });
          return acc;
        }, []);

        const quest: LogItem[] = (quests.quests ?? [])
          .map((q) => ({ type: 'quest' as const, date: '', label: q.title }))
          .slice(0, 3);

        const reward: LogItem[] = (rewards.rewards ?? [])
          .map((r) => ({ type: 'reward' as const, date: '', label: r.label }))
          .slice(0, 3);

        setItems(
          [...cleaning, ...propose, ...quest, ...reward].sort((a, b) => b.date.localeCompare(a.date)),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.type === filter)),
    [filter, items],
  );

  const tabs: Array<{ id: 'all' | LogKind; label: string }> = [
    { id: 'all', label: '전체' },
    { id: 'cleaning', label: '청소' },
    { id: 'propose', label: '제안' },
    { id: 'quest', label: '일일퀘스트' },
    { id: 'reward', label: '보상' },
  ];

  return (
    <div className="flex flex-col gap-3 px-4 pt-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
              filter === t.id ? 'bg-[#00b8cf] text-white' : 'bg-white text-[#828c94]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-[#828c94]">로그를 불러오는 중...</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.slice(0, 20).map((item, i) => (
            <li key={`${item.type}-${item.date}-${i}`}>
              {item.date ? (
                <button
                  type="button"
                  onClick={() => onSelect(item.date)}
                  className="ch-card flex w-full items-center gap-3 p-3 text-left"
                >
                  <span className="rounded-full bg-[#e8f8fb] px-2 py-0.5 text-[10px] font-bold text-[#00b8cf]">
                    {tabs.find((t) => t.id === item.type)?.label}
                  </span>
                  <span className="text-xs text-[#828c94]">{item.date}</span>
                  {item.score ? <span className="ml-auto text-xs font-bold text-[#00b8cf]">{item.score}점</span> : null}
                </button>
              ) : (
                <div className="ch-card flex w-full items-center gap-3 p-3 text-left">
                  <span className="rounded-full bg-[#e8f8fb] px-2 py-0.5 text-[10px] font-bold text-[#00b8cf]">
                    {tabs.find((t) => t.id === item.type)?.label}
                  </span>
                  <span className="text-xs text-[#828c94]">{item.label}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LogViewBody({ dateParam }: { dateParam: string | null }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(dateParam);

  if (selectedDate) {
    return (
      <>
        <div className="px-4 pt-4">
          <Link href="/log" className="text-xs font-semibold text-[#00b8cf]" onClick={() => setSelectedDate(null)}>
            ← 목록으로
          </Link>
        </div>
        <CleaningLogView dateParam={selectedDate} />
      </>
    );
  }
  return <LogList onSelect={setSelectedDate} />;
}

function LogPageInner() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  return (
    <RoleShell>
      <LogViewBody dateParam={dateParam} />
    </RoleShell>
  );
}

export default function LogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50dvh] items-center justify-center text-sm text-[#828c94]">
          로그 불러오는 중...
        </div>
      }
    >
      <LogPageInner />
    </Suspense>
  );
}
