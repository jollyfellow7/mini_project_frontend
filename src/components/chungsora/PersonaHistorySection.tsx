'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Bell } from 'lucide-react';
import {
  fetchPersonaHistory,
  markPersonaHistorySeen,
  type PersonaHistoryItem,
} from '@/lib/chungsora/clientApi';
import {
  COACH_CHARACTERS,
  normalizeCoachCharacterId,
} from '@/lib/chungsora/coachCharacters';

type PersonaHistorySectionProps = {
  /** parent = 미확인 알림 + '확인' 버튼 노출 / child = 이력 열람만 */
  role: 'parent' | 'child';
  /** 부모가 알림을 확인했을 때 상위에 통지 (배지 갱신용) */
  onSeen?: () => void;
  /** 최초 펼침 여부 */
  defaultOpen?: boolean;
};

function personaName(id: string | null): string {
  if (!id) return '기본';
  return COACH_CHARACTERS[normalizeCoachCharacterId(id)]?.name ?? id;
}

function formatAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function describe(item: PersonaHistoryItem): string {
  const who = item.changed_by === 'child' ? '자녀' : '부모';
  const to = personaName(item.to_persona);
  const tone = item.to_informal ? '반말' : '존댓말';
  if (item.from_persona && item.from_persona !== item.to_persona) {
    return `${who}가 ${personaName(item.from_persona)} → ${to}(${tone})로 변경`;
  }
  return `${who}가 ${to}(${tone})로 설정`;
}

export function PersonaHistorySection({
  role,
  onSeen,
  defaultOpen = false,
}: PersonaHistorySectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [items, setItems] = useState<PersonaHistoryItem[]>([]);
  const [unseen, setUnseen] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchPersonaHistory();
      setItems(res.items);
      setUnseen(res.unseen_count);
    } catch {
      /* 조회 실패는 조용히 무시 */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const handleSeen = useCallback(async () => {
    setUnseen(0);
    try {
      const res = await markPersonaHistorySeen();
      setItems(res.items);
      setUnseen(res.unseen_count);
    } catch {
      /* 로컬만 반영 */
    }
    onSeen?.();
  }, [onSeen]);

  const showParentAlert = role === 'parent' && unseen > 0;

  return (
    <div className="ch-card overflow-hidden">
      {showParentAlert && (
        <div className="flex items-center justify-between gap-2 border-b border-[#ffe8cc] bg-[#fff8f0] px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-[#f08c00]" />
            <span className="text-[13px] font-semibold text-[#b15c00]">
              자녀가 안내 친구를 {unseen}번 바꿨어요
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleSeen()}
            className="rounded-lg bg-[#f08c00] px-3 py-1.5 text-[12px] font-bold text-white"
          >
            확인
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-[14px] font-semibold text-[#1a1e22]">
          최근 안내 친구 변경 이력
          {role === 'parent' && unseen > 0 && (
            <span className="rounded-full bg-[#fa5252] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unseen}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp size={18} className="text-[#adb5bd]" />
        ) : (
          <ChevronDown size={18} className="text-[#adb5bd]" />
        )}
      </button>

      {open && (
        <div className="border-t border-[#f0f2f4] px-4 py-3">
          {!loaded ? (
            <p className="py-2 text-[13px] text-[#adb5bd]">불러오는 중…</p>
          ) : items.length === 0 ? (
            <p className="py-2 text-[13px] text-[#adb5bd]">아직 변경 이력이 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span
                    className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${item.changed_by === 'child' ? 'bg-[#00b8cf]' : 'bg-[#adb5bd]'}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-[13px] text-[#1a1e22]">{describe(item)}</span>
                    <span className="text-[11px] text-[#adb5bd]">{formatAt(item.at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
