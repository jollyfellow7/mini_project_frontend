'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { MONTHLY_CASH_CAP, wonToP } from '@/lib/chungsora/tokens';
import {
  DEFAULT_COACH_ID,
  normalizeCoachCharacterId,
  type CoachCharacterId,
} from '@/lib/chungsora/coachCharacters';
import { useSettingsStore } from '@/lib/chungsora/settingsStore';
import { deferEffect } from '@/lib/react/deferEffect';

const BASE_OPTIONS = [500, 1000, 1500, 2000, 2500];
const QUEST_REWARD_OPTIONS = [500, 1000, 1500, 2000];

function RewardsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const baseCleanWon = useSettingsStore((s) => s.baseCleanWon);
  const setBaseCleanWon = useSettingsStore((s) => s.setBaseCleanWon);

  const [rewards, setRewards] = useState<ShopReward[]>([]);
  const [quests, setQuests] = useState<DailyQuest[]>([]);

  const [newRewardLabel, setNewRewardLabel] = useState('');
  const [newRewardWon, setNewRewardWon] = useState(1000);

  const [editRewardId, setEditRewardId] = useState<string | null>(null);
  const [editRewardLabel, setEditRewardLabel] = useState('');
  const [editRewardWon, setEditRewardWon] = useState(1000);

  const [showQuestForm, setShowQuestForm] = useState(searchParams.get('addQuest') === '1');
  const [questTitle, setQuestTitle] = useState('');
  const [questDescription, setQuestDescription] = useState('');
  const [questRewardWon, setQuestRewardWon] = useState(1000);

  const [coachId, setCoachId] = useState<CoachCharacterId>(DEFAULT_COACH_ID);
  const [informal, setInformal] = useState(false);

  const totalRewardWon = useMemo(
    () => rewards.reduce((sum, r) => sum + (Number.isFinite(r.won) ? r.won : 0), 0),
    [rewards],
  );

  const load = useCallback(async () => {
    try {
      const [shopRes, questRes, family] = await Promise.all([
        fetchShopRewards(),
        fetchDailyQuests(),
        fetchFamilySummary(),
      ]);

      setRewards(shopRes.rewards ?? []);
      setQuests(questRes.quests ?? []);

      setCoachId(normalizeCoachCharacterId(family.coach_character_id));
      setInformal(!!family.coach_informal_mode);
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

  const addReward = async () => {
    const label = newRewardLabel.trim();
    if (!label) return;

    try {
      const res = await createShopReward(label, newRewardWon);
      setRewards(res.rewards);
    } catch {
      setRewards((prev) => [...prev, { id: `local-${Date.now()}`, label, won: newRewardWon }]);
    }

    setNewRewardLabel('');
    setNewRewardWon(1000);
  };

  const startEditReward = (r: ShopReward) => {
    setEditRewardId(r.id);
    setEditRewardLabel(r.label);
    setEditRewardWon(r.won);
  };

  const saveEditReward = async () => {
    if (!editRewardId) return;

    try {
      const res = await updateShopReward(editRewardId, {
        label: editRewardLabel,
        won: editRewardWon,
      });
      setRewards(res.rewards);
    } catch {
      setRewards((prev) =>
        prev.map((r) =>
          r.id === editRewardId ? { ...r, label: editRewardLabel, won: editRewardWon } : r,
        ),
      );
    }

    setEditRewardId(null);
  };

  const removeReward = async (id: string) => {
    try {
      const res = await deleteShopReward(id);
      setRewards(res.rewards);
    } catch {
      setRewards((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const addQuest = async () => {
    const title = questTitle.trim();
    if (!title) return;

    const description = questDescription.trim() || '부모가 추가한 일일 퀘스트';
    const rewardWon = questRewardWon;

    try {
      const res = await createDailyQuest(title, description, rewardWon);
      setQuests(res.quests);
    } catch {
      setQuests((prev) => [
        {
          id: `local-${Date.now()}`,
          title,
          description,
          reward_won: rewardWon,
          active: true,
        },
        ...prev,
      ]);
    }

    setQuestTitle('');
    setQuestDescription('');
    setQuestRewardWon(1000);
    setShowQuestForm(false);
    router.replace('/parent/rewards');
  };

  const removeQuest = async (id: string) => {
    try {
      const res = await deleteDailyQuest(id);
      setQuests(res.quests);
    } catch {
      setQuests((prev) => prev.filter((q) => q.id !== id));
    }
  };

  return (
    <>
      <header className="px-5 pb-2 pt-4">
        <h1 className="text-[22px] font-bold text-[#2f3438]">보상 설정</h1>
        <p className="mt-1 text-sm text-[#8e8e8e]">포인트 기준, 일일퀘스트, 안내 친구를 설정하세요.</p>
      </header>

      <div className="flex flex-col gap-4 px-5 pb-6">
        <section id="quests" className="ch-card p-4">
          <p className="text-sm font-bold text-[#2f3438]">일일 퀘스트</p>
          <p className="mt-1 text-xs text-[#828c94]">자녀 홈에 표시되는 부모 등록 퀘스트입니다.</p>

          <ul className="mt-3 space-y-2">
            {quests.length === 0 ? (
              <li className="text-xs text-[#adb5bd]">등록된 퀘스트가 없습니다.</li>
            ) : (
              quests.map((q) => (
                <li
                  key={q.id}
                  className="rounded-lg bg-[#f7f9fa] px-3 py-2 text-sm text-[#2f3438]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{q.title}</span>
                    <button
                      type="button"
                      onClick={() => void removeQuest(q.id)}
                      className="text-xs text-[#828c94] underline"
                    >
                      삭제
                    </button>
                  </div>
                  {q.description ? (
                    <p className="mt-1 text-xs text-[#828c94]">{q.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[#00b8cf]">
                    {q.reward_won.toLocaleString()}원 ({wonToP(q.reward_won)}P)
                  </p>
                </li>
              ))
            )}
          </ul>

          {showQuestForm ? (
            <div className="mt-3 space-y-2">
              <input
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
                placeholder="퀘스트 이름 (예: 방 청소)"
                className="w-full rounded-xl border border-[#eaedef] px-3 py-2 text-sm outline-none focus:border-[#00b8cf]"
              />
              <input
                value={questDescription}
                onChange={(e) => setQuestDescription(e.target.value)}
                placeholder="수행 안내 (선택)"
                className="w-full rounded-xl border border-[#eaedef] px-3 py-2 text-sm outline-none focus:border-[#00b8cf]"
              />
              <div className="flex gap-2">
                {QUEST_REWARD_OPTIONS.map((won) => (
                  <button
                    key={won}
                    type="button"
                    onClick={() => setQuestRewardWon(won)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                      questRewardWon === won
                        ? 'bg-[#e8f8fb] text-[#00b8cf] ring-1 ring-[#00b8cf]'
                        : 'border border-[#eaedef] text-[#828c94]'
                    }`}
                  >
                    {won.toLocaleString()}원
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void addQuest()} className="ch-btn-primary flex-1 py-2.5 text-sm">
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestForm(false)}
                  className="flex-1 rounded-xl border border-[#dbdbdb] py-2.5 text-sm text-[#2f3438]"
                >
                  취소
                </button>
              </div>
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
        </section>

        <section className="ch-card p-4">
          <p className="text-sm font-bold text-[#2f3438]">청소 1회 기본 보상</p>
          <p className="mt-1 text-xs text-[#828c94]">AI 점수 비율만큼 지급됩니다. (500원 단위)</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {BASE_OPTIONS.map((won) => (
              <button
                key={won}
                type="button"
                onClick={() => {
                  setBaseCleanWon(won);
                  void updateFamilyProfile({ base_clean_won: won }).catch(() => undefined);
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  won === baseCleanWon
                    ? 'bg-[#e8f8fb] text-[#00b8cf] ring-1 ring-[#00b8cf]'
                    : 'border border-[#eaedef] text-[#828c94]'
                }`}
              >
                {won.toLocaleString()}원
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold text-[#00b8cf]">
            예: {baseCleanWon.toLocaleString()}원, 90점이면 {wonToP(Math.floor(baseCleanWon * 0.9))}P
          </p>
        </section>

        <section className="ch-card p-4">
          <CoachCharacterPicker
            value={coachId}
            onChange={(id) => {
              setCoachId(id);
              void updateFamilyProfile({ coach_character_id: id }).catch(() => undefined);
            }}
            informal={informal}
            onInformalChange={(v) => {
              setInformal(v);
              void updateFamilyProfile({ informal_mode: v }).catch(() => undefined);
            }}
          />
        </section>

        <section>
          <p className="text-sm font-bold text-[#1a1e22]">사용자 보상</p>
          <p className="mt-1 text-xs text-[#8e8e8e]">
            합계 {totalRewardWon.toLocaleString()}원 / 월 한도 {MONTHLY_CASH_CAP.toLocaleString()}원
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {rewards.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#d8dde1] px-3 py-4 text-center text-xs text-[#adb5bd]">
                아직 등록된 보상이 없습니다.
              </p>
            ) : (
              rewards.map((r) => (
                <div key={r.id} className="ch-card flex items-center justify-between gap-2 px-3 py-2.5">
                  {editRewardId === r.id ? (
                    <>
                      <input
                        value={editRewardLabel}
                        onChange={(e) => setEditRewardLabel(e.target.value)}
                        className="w-[45%] rounded-lg border border-[#eaedef] px-2 py-1.5 text-sm"
                      />
                      <input
                        type="number"
                        min={100}
                        step={100}
                        value={editRewardWon}
                        onChange={(e) => setEditRewardWon(Number(e.target.value || 0))}
                        className="w-[25%] rounded-lg border border-[#eaedef] px-2 py-1.5 text-sm"
                      />
                      <button type="button" onClick={() => void saveEditReward()} className="text-xs font-semibold text-[#00b8cf]">
                        저장
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-[#2f3438]">{r.label}</p>
                        <p className="text-xs text-[#8e8e8e]">{r.won.toLocaleString()}원</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => startEditReward(r)} className="text-xs text-[#00b8cf]">
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeReward(r.id)}
                          className="text-xs text-[#f04452]"
                        >
                          삭제
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="ch-card mt-3 p-3">
            <p className="text-xs font-semibold text-[#2f3438]">보상 추가</p>
            <div className="mt-2 flex gap-2">
              <input
                value={newRewardLabel}
                onChange={(e) => setNewRewardLabel(e.target.value)}
                placeholder="예: 외출하기"
                className="flex-1 rounded-xl border border-[#eaedef] px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={100}
                step={100}
                value={newRewardWon}
                onChange={(e) => setNewRewardWon(Number(e.target.value || 0))}
                className="w-28 rounded-xl border border-[#eaedef] px-3 py-2 text-sm"
              />
            </div>
            <button type="button" onClick={() => void addReward()} className="ch-btn-primary mt-2 w-full py-2.5 text-sm">
              보상 추가
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

export default function RewardsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50dvh] items-center justify-center text-sm text-[#828c94]">보상 설정 불러오는 중...</div>}>
      <RewardsPageInner />
    </Suspense>
  );
}
