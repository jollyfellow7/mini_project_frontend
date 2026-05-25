'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MissionStepper } from '@/components/chungsora/MissionStepper';
import { CoachAvatar } from '@/components/chungsora/CoachAvatar';
import { fetchFamilySummary, fetchLockPolicy } from '@/lib/chungsora/clientApi';
import {
  COACH_CHARACTERS,
  resolveEffectiveCoachId,
  type CoachCharacterId,
} from '@/lib/chungsora/coachCharacters';
import { useCleaningSessionStore } from '@/lib/chungsora/cleaningSessionStore';
import { postToNative } from '@/lib/chungsora/nativeBridge';
import { useSettingsStore } from '@/lib/chungsora/settingsStore';

export default function ChildLockPage() {
  const allowPhone = useSettingsStore((s) => s.allowPhone);
  const lockTime = useSettingsStore((s) => s.lockTime);
  const setLockTime = useSettingsStore((s) => s.setLockTime);
  const setLockDays = useSettingsStore((s) => s.setLockDays);
  const setPassScore = useSettingsStore((s) => s.setPassScore);
  const setAllowPhone = useSettingsStore((s) => s.setAllowPhone);
  const setCoachIds = useSettingsStore((s) => s.setCoachIds);
  const setPhase = useCleaningSessionStore((s) => s.setPhase);
  const [coachId, setCoachId] = useState<CoachCharacterId>('mentor');
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [allowedNumbers, setAllowedNumbers] = useState<{ name: string; number: string }[]>([]);

  // Flutter WebView 잠금 화면 진입 시 native 오버레이 활성화 (Device Owner 불필요)
  useEffect(() => {
    postToNative('lock');
  }, []);

  useEffect(() => {
    const sync = () => {
      void fetchLockPolicy()
        .then((p) => {
          setLockTime(p.lock_time);
          setLockDays(p.lock_days);
          setPassScore(p.pass_score);
          setAllowPhone(p.allow_phone);
          setAllowedNumbers(
            Array.isArray(p.allowed_numbers)
              ? p.allowed_numbers
                  .filter((v): v is { name: string; number: string } => !!v && typeof v.name === 'string' && typeof v.number === 'string')
              : [],
          );
        })
        .catch(() => undefined);
      void fetchFamilySummary()
        .then((s) => {
          setCoachIds(s.coach_character_id, s.child_coach_character_id ?? null);
          setCoachId(
            resolveEffectiveCoachId(
              s.coach_character_id,
              s.child_coach_character_id,
              s.effective_coach_character_id,
            ),
          );
        })
        .catch(() => undefined);
    };
    sync();
    const t = setInterval(sync, 60_000);
    return () => clearInterval(t);
  }, [setLockTime, setLockDays, setPassScore, setAllowPhone, setCoachIds]);

  const coach = COACH_CHARACTERS[coachId];

  return (
    <div className="flex min-h-dvh flex-col">
      <button
        type="button"
        onClick={() => setPhoneModalOpen(true)}
        className="fixed right-3 top-3 z-50 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur"
      >
        📞 전화
      </button>
      <MissionStepper current={1} />
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center bg-[#2f3438] px-6 py-10 text-center text-white">
        <p className="rounded-full bg-[#f04452] px-4 py-1 text-xs font-bold">잠금 ON</p>
        <Lock className="mt-6 h-12 w-12 text-white/90" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 text-xl font-bold">방 청소하면 폰이 풀려요</h1>
        <p className="mt-2 text-sm text-white/70">유튜브 · 게임 · 카톡 차단 · {lockTime}부터</p>
        {allowPhone && (
          <p className="mt-3 text-xs text-white/50">전화 · 긴급번호는 사용 가능</p>
        )}
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-white/80">
          <CoachAvatar characterId={coachId} size="sm" />
          오늘 안내 · {coach.name}
        </p>
        <Link
          href="/child/mission/before"
          onClick={() => {
            setPhase('dirty');
            postToNative('missionStart');
          }}
          className="ch-btn-primary mt-8 block w-full max-w-xs py-4 text-center text-[15px]"
        >
          오늘 방 청소 미션
        </Link>
      </div>

      {phoneModalOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4"
              onClick={() => setPhoneModalOpen(false)}
            >
              <div
                className="w-full max-w-sm rounded-2xl bg-white p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-base font-bold text-[#2f3438]">긴급전화</p>
                <ul className="mt-3 space-y-2">
                  {[
                    { name: '119 (소방·구급)', number: '119' },
                    { name: '112 (경찰)', number: '112' },
                    { name: '120 (다산콜)', number: '120' },
                    ...allowedNumbers,
                  ].map((n) => (
                    <li key={`${n.name}-${n.number}`}>
                      <a
                        href={`tel:${n.number}`}
                        className="block rounded-lg bg-[#f7f9fa] px-3 py-3 text-sm text-[#2f3438]"
                      >
                        {n.name} · <span className="font-bold text-[#00b8cf]">{n.number}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setPhoneModalOpen(false)}
                  className="mt-4 w-full rounded-lg bg-[#2f3438] py-2.5 text-sm font-bold text-white"
                >
                  닫기
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
