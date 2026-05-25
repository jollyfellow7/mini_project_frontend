'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChatBubble,
  MessageComposer,
  type ChatEntry,
} from '@/components/chungsora/MessageComposer';
import { LogPhotoPair } from '@/components/chungsora/LogPhotoPair';
import { fetchLogDetail, postLogMessage, fetchPraisePresets, fetchFamilySummary } from '@/lib/chungsora/clientApi';
import {
  LOG_CHAT_BG,
  formatLogDateLabel,
  parseLogDateParam,
  toLogDateParam,
} from '@/lib/chungsora/logV2';
import { usePraiseStore } from '@/lib/chungsora/praiseStore';
import { getRole, type ChungsoraRole } from '@/lib/chungsora/role';
import { calcCleaningPayout } from '@/lib/chungsora/tokens';
import { deferEffect } from '@/lib/react/deferEffect';

const FIREWORKS_KEY = 'chungsora-log-fireworks-seen';

function getScoreGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'S', color: '#d4a017' }; // 금색
  if (score >= 80) return { grade: 'A', color: '#1a6fdb' }; // 파란색
  if (score >= 70) return { grade: 'B', color: '#2a9d5c' }; // 초록색
  return { grade: 'C', color: '#828c94' };                   // 회색
}

type CleaningLogViewProps = {
  role?: ChungsoraRole;
  showBack?: boolean;
  dateParam?: string | null;
};

function nowTimeLabel() {
  return new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function enrichMessage(m: ChatEntry): ChatEntry {
  if (m.time) return m;
  if (m.at) {
    return {
      ...m,
      time: new Date(m.at).toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  }
  return { ...m, time: nowTimeLabel() };
}

export function CleaningLogView({ role: roleProp, showBack, dateParam }: CleaningLogViewProps) {
  const [role, setRole] = useState<ChungsoraRole>(roleProp ?? 'parent');
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFireworks, setShowFireworks] = useState(false);
  const [baseCleanWon, setBaseCleanWon] = useState(0);
  const setCustomPraises = usePraiseStore((s) => s.setCustomPraises);

  const logDate = useMemo(() => parseLogDateParam(dateParam), [dateParam]);
  const dateKey = toLogDateParam(logDate);
  const dateLabel = formatLogDateLabel(logDate);
  const payout = calcCleaningPayout(baseCleanWon, score, streakDays);

  useEffect(() => {
    deferEffect(() => {
      if (roleProp) setRole(roleProp);
      else setRole(getRole());
    });
  }, [roleProp]);

  useEffect(() => {
    if (role !== 'child') return;
    let fireworksTimer: ReturnType<typeof setTimeout> | undefined;
    deferEffect(() => {
      const seen = localStorage.getItem(FIREWORKS_KEY);
      if (!seen) {
        setShowFireworks(true);
        localStorage.setItem(FIREWORKS_KEY, '1');
        fireworksTimer = setTimeout(() => setShowFireworks(false), 3200);
      }
    });
    return () => {
      if (fireworksTimer) clearTimeout(fireworksTimer);
    };
  }, [role]);

  const loadLog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchLogDetail(dateKey);
      setMessages(res.messages?.map(enrichMessage) ?? []);
      setBeforeUrl(res.before_url ?? null);
      setAfterUrl(res.after_url ?? null);
      setScore(res.score ?? 0);
      setStreakDays(res.streak_days ?? 0);
    } catch {
      setError('로그를 불러오지 못했습니다.');
      setMessages([]);
      setBeforeUrl(null);
      setAfterUrl(null);
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    deferEffect(() => {
      void loadLog();
    });
  }, [loadLog]);

  useEffect(() => {
    deferEffect(() => {
      void fetchFamilySummary()
        .then((s) => setBaseCleanWon(s.base_clean_won))
        .catch(() => setBaseCleanWon(0));
    });
  }, []);

  useEffect(() => {
    deferEffect(() => {
      void fetchPraisePresets()
        .then((res) => setCustomPraises(res.presets ?? []))
        .catch(() => setCustomPraises([]));
    });
  }, [setCustomPraises]);

  const handleSend = async (text: string, badge?: string) => {
    const tempId = `tmp-${Date.now()}`;
    const optimistic: ChatEntry = {
      id: tempId,
      role,
      text,
      badge: role === 'parent' ? badge : undefined,
      time: nowTimeLabel(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await postLogMessage(dateKey, {
        role,
        text,
        badge: role === 'parent' ? badge : undefined,
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? enrichMessage(res.message) : m)),
      );
    } catch {
      /* optimistic 유지 */
    }
  };

  const gradeInfo = getScoreGrade(score);
  const scoreDetail = `${baseCleanWon.toLocaleString()}원×${score}%×${payout.mult} = +${payout.finalP}P`;

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col">
      {showFireworks && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => setShowFireworks(false)}
        >
          <div className="rounded-2xl bg-white px-6 py-8 text-center shadow-lg">
            <p className="text-4xl">🎉</p>
            <p className="mt-3 text-lg font-bold text-[#2f3438]">첫 청소 로그!</p>
            <p className="mt-1 text-sm text-[#828c94]">엄마·아빠와 대화를 나눠보세요</p>
            <p className="mt-3 text-xs text-[#828c94]">탭하면 닫혀요</p>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col" style={{ background: LOG_CHAT_BG }}>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {showBack && (
            <Link href="/child/home" className="mb-2 inline-block text-xs font-semibold text-[#2f3438]/80">
              ← 홈
            </Link>
          )}

          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-[#2f3438]">{dateLabel}</p>
            <span className="rounded-full bg-[#e8f9ee] px-2.5 py-1 text-[11px] font-bold text-[#00c73c]">
              스트릭 {streakDays}일
            </span>
          </div>
          <div className="mb-3 flex items-center gap-1.5">
            <span className="text-xs text-[#828c94]">AI {score}점</span>
            <span
              className="rounded px-1.5 py-0.5 text-[11px] font-bold text-white"
              style={{ backgroundColor: gradeInfo.color }}
            >
              {gradeInfo.grade}
            </span>
            <span className="text-xs text-[#828c94]">· {scoreDetail}</span>
          </div>

          <LogPhotoPair beforeUrl={beforeUrl} afterUrl={afterUrl} />

          {error ? (
            <p className="py-6 text-center text-xs text-red-500">{error}</p>
          ) : loading ? (
            <p className="py-6 text-center text-xs text-[#828c94]">대화 불러오는 중…</p>
          ) : (
            <div className="flex flex-col gap-3 pb-2">
              {messages.map((m) => (
                <ChatBubble key={m.id} entry={m} />
              ))}
            </div>
          )}
        </div>

        <MessageComposer viewer={role} onSend={handleSend} />
      </div>
    </div>
  );
}
