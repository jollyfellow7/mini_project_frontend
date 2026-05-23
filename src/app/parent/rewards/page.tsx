'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { MONTHLY_CASH_CAP, wonToP } from '@/lib/chungsora/tokens';
import { useSettingsStore } from '@/lib/chungsora/settingsStore';
import { CoachCharacterPicker } from '@/components/chungsora/CoachCharacterPicker';
import {
  createDailyQuest,
  createShopReward,
  deleteDailyQuest,
  deleteShopReward,
  fetchDailyQuests,
  fetchFamilySummary,
  fetchShopRewards,
  updateFamilyProfile,
  updateShopReward,
  type DailyQuest,
  type ShopReward,
} from '@/lib/chungsora/clientApi';
import {
  normalizeCoachCharacterId,
  type CoachCharacterId,
} from '@/lib/chungsora/coachCharacters';
import { deferEffect } from '@/lib/react/deferEffect';

const BASE_OPTIONS = [500, 1000, 1500, 2000, 2500];

function RewardsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const baseCleanWon = useSettingsStore((s) => s.baseCleanWon);
  const setBaseCleanWon = useSettingsStore((s) => s.setBaseCleanWon);

  const [rewards, setRewards] = useState<ShopReward[]>([]);
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editWon, setEditWon] = useState(1000);
  const [newLabel, setNewLabel] = useState('');
  const [newWon, setNewWon] = useState(1000);
  const [questTitle, setQuestTitle] = useState('');
  const [showQuestForm, setShowQuestForm] = useState(searchParams.get('addQuest') === '1');
  const [coachId, setCoachId] = useState<CoachCharacterId>('jiu');

  const load = useCallback(async () => {
    try {
      const [shop, q, family] = await Promise.all([
        fetchShopRewards(),
        fetchDailyQuests(),
        fetchFamilySummary(),
      ]);
      setRewards(shop.rewards);
      setQuests(q.quests);
      setCoachId(normalizeCoachCharacterId(family.coach_character_id));
      if (family.base_clean_won) setBaseCleanWon(family.base_clean_won);
    } catch {
      setRewards([]);
      setQuests([]);
    }
  }, [setBaseCleanWon]);

  useEffect(() => {
    deferEffect(() => {
      void load();
    });
  }, [load]);

  const startEdit = (r: ShopReward) => {
    setEditId(r.id);
    setEditLabel(r.label);
    setEditWon(r.won);
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      const res = await updateShopReward(editId, { label: editLabel, won: editWon });
      setRewards(res.rewards);
    } catch {
      setRewards((prev) =>
        prev.map((r) => (r.id === editId ? { ...r, label: editLabel, won: editWon } : r)),
      );
    }
    setEditId(null);
  };

  const removeReward = async (id: string) => {
    try {
      const res = await deleteShopReward(id);
      setRewards(res.rewards);
    } catch {
      setRewards((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const addReward = async () => {
    if (!newLabel.trim()) return;
    try {
      const res = await createShopReward(newLabel.trim(), newWon);
      setRewards(res.rewards);
    } catch {
      setRewards((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, label: newLabel.trim(), won: newWon },
      ]);
    }
    setNewLabel('');
    setNewWon(1000);
  };

  const removeQuest = async (id: string) => {
    try {
      const res = await deleteDailyQuest(id);
      setQuests(res.quests);
    } catch {
      setQuests((prev) => prev.filter((q) => q.id !== id));
    }
  };

  const addQuest = async () => {
    if (!questTitle.trim()) return;
    try {
      const res = await createDailyQuest(questTitle.trim(), '부모가 추가한 일일 퀘스트');
      setQuests(res.quests);
    } catch {
      setQuests((prev) => [
        {
          id: `local-${Date.now()}`,
          title: questTitle.trim(),
          description: '부모가 추가한 일일 퀘스트',
          active: true,
        },
        ...prev,
      ]);
    }
    setQuestTitle('');
    setShowQuestForm(false);
    router.replace('/parent/rewards');
  };

  return (
    <>
      <header className="px-5 pb-2 pt-4">
        <h1 className="text-[22px] font-bold text-[#2f3438]">보상 설정</h1>
        <p className="mt-1 text-sm text-[#8e8e8e]">포인트 상점 · 기본 보상 · 안내 친구</p>
      </header>

      <div className="flex flex-col gap-4 px-5 pb-6">
        <div id="quests" className="ch-card p-4">
          <p className="text-sm font-bold text-[#2f3438]">일일 퀘스트</p>
          <p className="mt-1 text-xs text-[#828c94]">자녀 홈에서 시작 · 스케줄 시간에 잠금</p>
          <ul className="mt-3 space-y-2">
            {quests.length === 0 ? (
              <li className="text-xs text-[#adb5bd]">등록된 퀘스트가 없어요</li>
            ) : (
              quests.map((q) => (
                <li key={q.id} className="flex items-center justify-between rounded-lg bg-[#f7f9fa] px-3 py-2 text-sm text-[#2f3438]">
                  <span>{q.title}</span>
                  <button
                    type="button"
                    onClick={() => void removeQuest(q.id)}
                    className="text-xs text-[#828c94] underline"
                  >
                    삭제
                  </button>
                </li>
              ))
            )}
          </ul>
          {showQuestForm ? (
            <div className="mt-3 flex gap-2">
              <input
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
                placeholder="퀘스트 이름 (예: 방 청소)"
                className="flex-1 rounded-xl border border-[#eaedef] px-3 py-2 text-sm outline-none focus:border-[#00b8cf]"
              />
              <button type="button" onClick={() => void addQuest()} className="ch-btn-primary px-4 text-sm">
                추가
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowQuestForm(true)}
              className="ch-btn-secondary mt-3 w-full py-2.5 text-sm"
            >
              + 일일 퀘스트 추가
            </button>
          )}
        </div>

        <div className="ch-card p-4">
          <p className="text-sm font-bold text-[#2f3438]">청소 1회 기본 보상</p>
          <p className="mt-1 text-xs text-[#828c94]">AI 점수%만큼만 지급 · 500원 단위</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {BASE_OPTIONS.map((won) => (
              <button
                key={won}
                type="button"
                onClick={() => {
                  setBaseCleanWon(won);
                  void updateFamilyProfile({ base_clean_won: won }).catch(() => undefined);
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  won === baseCleanWon
                    ? 'bg-[#e8f8fb] text-[#00b8cf] ring-1 ring-[#00b8cf]'
                    : 'border border-[#eaedef] text-[#828c94] hover:border-[#00b8cf]'
                }`}
              >
                {won.toLocaleString()}원
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold text-[#00b8cf]">
            예: {baseCleanWon.toLocaleString()}원 · 90점 → {wonToP(Math.floor(baseCleanWon * 0.9))}P
          </p>
        </div>

        <div className="ch-card p-4">
          <CoachCharacterPicker
            value={coachId}
            onChange={(id) => {
              setCoachId(id);
              void updateFamilyProfile({ coach_character_id: id }).catch(() => undefined);
            }}
          />
        </div>

        <p className="text-sm font-bold text-[#1a1e22]">포인트 상점</p>
        {rewards.map((r) => (
          <div key={r.id} className="ch-card p-4">
            {editId === r.id ? (
              <div className="space-y-2">
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full rounded-lg border border-[#eaedef] px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={editWon}
                  onChange={(e) => setEditWon(Number(e.target.value))}
                  step={500}
                  className="w-full rounded-lg border border-[#eaedef] px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => void saveEdit()} className="ch-btn-primary flex-1 py-2 text-sm">
                    저장
                  </button>
                  <button type="button" onClick={() => setEditId(null)} className="ch-btn-secondary flex-1 py-2 text-sm">
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#2f3438]">{r.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#00b8cf]">
                    {r.won.toLocaleString()}원 · {wonToP(r.won)}P
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(r)} className="text-sm font-semibold text-[#00b8cf]">
                    수정
                  </button>
                  <button type="button" onClick={() => void removeReward(r.id)} className="text-sm text-[#adb5bd]">
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="ch-card space-y-2 p-4">
          <p className="text-sm font-bold text-[#2f3438]">+ 보상 추가</p>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="보상 이름"
            className="w-full rounded-lg border border-[#eaedef] px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={newWon}
            onChange={(e) => setNewWon(Number(e.target.value))}
            step={500}
            className="w-full rounded-lg border border-[#eaedef] px-3 py-2 text-sm"
          />
          <button type="button" onClick={() => void addReward()} className="ch-btn-primary w-full py-2.5 text-sm">
            추가하기
          </button>
        </div>

        <p className="rounded-xl bg-[#f0f2f4] px-4 py-3 text-xs text-[#828c94]">
          이번 달 예상 현금 지출 48,500원 / 상한 {MONTHLY_CASH_CAP.toLocaleString()}원
        </p>
      </div>
    </>
  );
}

export default function ParentRewardsPage() {
  return (
    <Suspense fallback={null}>
      <RewardsPageInner />
    </Suspense>
  );
}
