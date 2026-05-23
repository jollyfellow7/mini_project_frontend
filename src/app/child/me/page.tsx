'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  fetchFamilySummary,
  fetchPointsBalance,
  updatePersona,
} from '@/lib/chungsora/clientApi';
import { CoachCharacterPicker } from '@/components/chungsora/CoachCharacterPicker';
import { PersonaHistorySection } from '@/components/chungsora/PersonaHistorySection';
import {
  coachChangeAnnounce,
  resolveEffectiveCoachId,
  resolveEffectiveInformal,
  type CoachCharacterId,
} from '@/lib/chungsora/coachCharacters';
import { useCleaningSessionStore } from '@/lib/chungsora/cleaningSessionStore';
import { useSettingsStore } from '@/lib/chungsora/settingsStore';
import { useCoachSpeech } from '@/lib/chungsora/useCoachSpeech';
import { PROPOSAL_EVERY_P, WON_PER_P } from '@/lib/chungsora/tokens';

export default function ChildMePage() {
  const [name, setName] = useState('자녀');
  const [balance, setBalance] = useState(0);
  const [streak, setStreak] = useState(0);
  const [coachId, setCoachId] = useState<CoachCharacterId>('mentor');
  const [informal, setInformal] = useState(false);
  const phase = useCleaningSessionStore((s) => s.phase);
  const missionActive = phase !== 'idle' && phase !== 'unlock';
  const { speak } = useCoachSpeech(true);

  useEffect(() => {
    void fetchFamilySummary()
      .then((s) => {
        setName(s.child_display_name);
        setStreak(s.streak_days);
        const effective = resolveEffectiveCoachId(
          s.coach_character_id,
          s.child_coach_character_id,
          s.effective_coach_character_id,
        );
        setCoachId(effective);
        setInformal(resolveEffectiveInformal(effective, s.effective_informal_mode));
        useSettingsStore
          .getState()
          .setCoachIds(s.coach_character_id, s.child_coach_character_id ?? null);
      })
      .catch(() => undefined);
    void fetchPointsBalance()
      .then((b) => setBalance(b.balance))
      .catch(() => undefined);
  }, []);

  const persist = async (id: CoachCharacterId, wantInformal: boolean, announce: boolean) => {
    if (missionActive) return;
    try {
      const res = await updatePersona(id, wantInformal);
      // 백엔드 폴백 동기화 (반말 미지원이면 informal_mode=false 로 내려옴)
      const synced = !!res.informal_mode;
      setInformal(synced);
      useSettingsStore
        .getState()
        .setCoachIds(useSettingsStore.getState().coachCharacterId, id);
      if (announce) speak(coachChangeAnnounce(id, synced), { rate: 1.0 });
    } catch {
      /* 로컬만 반영 */
    }
  };

  const onCoachChange = async (id: CoachCharacterId) => {
    if (missionActive) return;
    setCoachId(id);
    const want = resolveEffectiveInformal(id, informal);
    setInformal(want);
    await persist(id, want, true);
  };

  const onInformalChange = async (v: boolean) => {
    if (missionActive) return;
    setInformal(v);
    await persist(coachId, v, false);
  };

  const proposalTokens = Math.floor(balance / PROPOSAL_EVERY_P);

  return (
    <>
      <header className="flex items-center justify-between px-5 pb-2 pt-4">
        <h1 className="text-[22px] font-bold text-[#1a1e22]">나</h1>
        <div className="text-right">
          <p className="font-bold text-[#00b8cf]">{balance}P</p>
          <p className="text-[10px] text-[#8e8e8e]">≈ {(balance * WON_PER_P).toLocaleString()}원</p>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-5 pb-6">
        <div className="ch-card p-4">
          <p className="text-sm font-medium text-[#1a1e22]">연속 {streak}일</p>
          <p className="mt-1 text-xs text-[#8e8e8e]">
            제안 가능 {proposalTokens}회 · 누적 {balance}P (매 {PROPOSAL_EVERY_P}P마다 1회)
          </p>
        </div>

        <div className="ch-card p-4">
          <CoachCharacterPicker
            title="안내 친구 바꾸기"
            value={coachId}
            onChange={(id) => void onCoachChange(id)}
            informal={informal}
            onInformalChange={(v) => void onInformalChange(v)}
            disabled={missionActive}
          />
        </div>

        {/* 변경 이력 (부모·자녀 모두 열람) */}
        <PersonaHistorySection role="child" />

        <div className="ch-card divide-y divide-[#f0f2f4]">
          {[
            ['이름', name],
            ['앱 버전', '1.0.0'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between px-4 py-3.5 text-sm">
              <span className="text-[#1a1e22]">{k}</span>
              <span className="text-[#8e8e8e]">{v}</span>
            </div>
          ))}
          <Link
            href="/child/pair/relink"
            className="flex justify-between px-4 py-3.5 text-sm text-[#00b8cf]"
          >
            <span>새 폰으로 다시 연결</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </>
  );
}
