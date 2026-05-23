'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchFamilySummary, patchLogMeta, uploadLogPhoto, updateFamilyProfile } from '@/lib/chungsora/clientApi';
import {
  SLOT_COUNT,
  compareAllSlotsWithBaseline,
  evaluateAllBaselineSlots,
  scanAllSlotCaptures,
} from '@/lib/chungsora/captureSlots';
import { padBaselineUrls, baselineSlotsReady } from '@/lib/chungsora/baselineUrls';
import { toLogDateParam } from '@/lib/chungsora/logV2';
import { deferEffect } from '@/lib/react/deferEffect';
import { useCleaningSessionStore, type QuestItem } from '@/lib/chungsora/cleaningSessionStore';
import { AiModelAlert } from '@/components/chungsora/AiModelAlert';
import { CoachAvatar } from '@/components/chungsora/CoachAvatar';
import { CoachSubtitle } from '@/components/chungsora/CoachSubtitle';
import {
  GhostAlignmentBar,
  GhostBaselineMedia,
  GhostBaselineMissingHint,
  GhostBaselineUnavailable,
  GhostBottomCue,
  GhostSlotBadge,
  GhostSlotGuide,
} from '@/components/chungsora/GhostOverlay';
import { AI_MODEL_ALERT_DEFAULT, isAiModelError } from '@/lib/chungsora/modelAlert';
import {
  COACH_CHARACTERS,
  resolveEffectiveCoachId,
  type CoachCharacterId,
} from '@/lib/chungsora/coachCharacters';
import {
  coachPausedSpeech,
  coachResumedSpeech,
  getCoachLine,
  subtitlePlaceholder,
  type CaptureCoachMode,
} from '@/lib/chungsora/coachLines';
import { ghostSlotConfig, type GhostSlotIndex } from '@/lib/chungsora/ghostSlots';
import { useCoachSpeech } from '@/lib/chungsora/useCoachSpeech';
import { useSettingsStore } from '@/lib/chungsora/settingsStore';
import type { MissionStep } from '@/components/chungsora/MissionStepper';

const SLOTS = ['입구', '바닥', '책상'] as const;

type CaptureCoachBodyProps = {
  mode: CaptureCoachMode;
  nextHref?: string;
  onComplete?: () => void;
  missionStep?: MissionStep;
};

function monstersToQuest(monsters: { name: string }[]): QuestItem[] {
  return monsters.slice(0, 5).map((m, i) => ({
    id: String(i + 1),
    label: m.name,
    done: false,
  }));
}

function emptySlots(): (File | null)[] {
  return Array.from({ length: SLOT_COUNT }, () => null);
}

function modeTitle(mode: CaptureCoachMode) {
  if (mode === 'baseline') return '기준 사진 · 3곳';
  if (mode === 'dirty') return '청소 전 · 3곳';
  return '청소 후 · 3곳';
}

export function CaptureCoachBody({ mode, nextHref, onComplete }: CaptureCoachBodyProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const ghostReadySpokenRef = useRef<Set<number>>(new Set());

  const familyCoach = useSettingsStore((s) => s.coachCharacterId);
  const childCoach = useSettingsStore((s) => s.childCoachCharacterId);
  const setCoachIds = useSettingsStore((s) => s.setCoachIds);

  const [slotIdx, setSlotIdx] = useState(0);
  const [slotCaptures, setSlotCaptures] = useState<(File | null)[]>(emptySlots);
  const [baselineUrls, setBaselineUrls] = useState<(string | null)[]>([null, null, null]);
  const [coachOn, setCoachOn] = useState(true);
  const [error, setError] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [ghostAligned, setGhostAligned] = useState(false);
  const [ghostMediaFailed, setGhostMediaFailed] = useState(false);
  const [characterId, setCharacterId] = useState<CoachCharacterId>('jiu');

  const setScanResult = useCleaningSessionStore((s) => s.setScanResult);
  const setVerifyResult = useCleaningSessionStore((s) => s.setVerifyResult);
  const setPhase = useCleaningSessionStore((s) => s.setPhase);
  const streakDays = useCleaningSessionStore((s) => s.streakDays);

  const coachMeta = COACH_CHARACTERS[characterId];
  const todayKey = toLogDateParam(new Date());
  const ghostUrl = mode !== 'baseline' ? baselineUrls[slotIdx] : null;
  const ghostSlot = slotIdx as GhostSlotIndex;
  const showGhostMedia = mode !== 'baseline' && !!ghostUrl && !ghostMediaFailed;
  const ghostMediaBroken = mode !== 'baseline' && !!ghostUrl && ghostMediaFailed;
  const ghostMediaMissing = mode !== 'baseline' && !ghostUrl;
  const slotsDone = slotCaptures.filter(Boolean).length;

  const loadBaselineUrls = useCallback(async () => {
    const s = await fetchFamilySummary();
    setCoachIds(s.coach_character_id, s.child_coach_character_id ?? null);
    setCharacterId(
      resolveEffectiveCoachId(
        s.coach_character_id,
        s.child_coach_character_id,
        s.effective_coach_character_id,
      ),
    );
    const padded = padBaselineUrls(s.baseline_urls, s.baseline_url);
    setBaselineUrls(padded);
    return { summary: s, urls: padded };
  }, [setCoachIds]);

  const resetCaptures = useCallback(() => {
    setSlotCaptures(emptySlots());
    setSlotIdx(0);
  }, []);

  const { subtitle, speak, showSubtitle, stop: stopCoach } = useCoachSpeech(coachOn);

  const say = useCallback(
    (phase: Parameters<typeof getCoachLine>[1], opts?: Parameters<typeof getCoachLine>[2]) => {
      const line = getCoachLine(characterId, phase, opts);
      speak(line, { rate: coachMeta.ttsRate });
    },
    [characterId, coachMeta.ttsRate, speak],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCoach();
    };
  }, [stopCoach]);

  const showFailure = useCallback(
    (msg: string) => {
      setError(msg);
      if (isAiModelError(msg)) {
        setAlertMessage(msg.trim() || AI_MODEL_ALERT_DEFAULT);
        setAlertOpen(true);
      }
      speak(msg, { force: true, rate: coachMeta.ttsRate });
    },
    [speak, coachMeta.ttsRate],
  );

  const toggleCoach = useCallback(() => {
    setCoachOn((prev) => {
      const next = !prev;
      if (!next) {
        stopCoach();
        showSubtitle(coachPausedSpeech(characterId));
      } else {
        speak(coachResumedSpeech(characterId), { rate: coachMeta.ttsRate });
      }
      return next;
    });
  }, [speak, showSubtitle, stopCoach, characterId, coachMeta.ttsRate]);

  useEffect(() => {
    deferEffect(() => {
      void loadBaselineUrls().catch(() => undefined);
    });
  }, [loadBaselineUrls]);

  useEffect(() => {
    ghostReadySpokenRef.current.clear();
    const intro = getCoachLine(characterId, 'mode_intro', { mode });
    const t = setTimeout(() => {
      if (coachOn) speak(intro, { rate: coachMeta.ttsRate });
      else showSubtitle(intro);
    }, 0);
    return () => clearTimeout(t);
  }, [mode, coachOn, speak, showSubtitle, characterId, coachMeta.ttsRate]);

  const goToSlot = useCallback(
    (index: number) => {
      setGhostAligned(false);
      setSlotIdx(index);
      ghostReadySpokenRef.current.add(index);
      if (mode === 'baseline' || !coachOn) return;
      if (!baselineUrls[index]) {
        speak(getCoachLine(characterId, 'baseline_missing', { slotIndex: index }), {
          rate: coachMeta.ttsRate,
        });
        return;
      }
      say('slot_enter', { slotIndex: index });
    },
    [mode, coachOn, baselineUrls, speak, say, characterId, coachMeta.ttsRate],
  );

  useEffect(() => {
    deferEffect(() => setGhostMediaFailed(false));
  }, [ghostUrl]);

  useEffect(() => {
    if (mode === 'baseline' || !coachOn || !ghostUrl || ghostMediaFailed) return;
    if (ghostReadySpokenRef.current.has(slotIdx)) return;
    ghostReadySpokenRef.current.add(slotIdx);
    say('align_hint', { slotIndex: slotIdx });
  }, [mode, coachOn, ghostUrl, ghostMediaFailed, slotIdx, say]);

  const persistCapture = async (
    file: File,
    phase: 'before' | 'after' | 'baseline',
    slot: number,
  ) => {
    await uploadLogPhoto(todayKey, phase, file, slot);
  };

  const ensureBaselineStored = async () => {
    const { urls } = await loadBaselineUrls();
    if (!baselineSlotsReady(urls)) {
      throw new Error('기준 사진 3곳이 확인되지 않았습니다. 다시 촬영해 주세요.');
    }
  };

  const finalizeAllSlots = async (captures: (File | null)[]) => {
    if (!mountedRef.current) return;
    setError('');
    setProcessing(true);

    try {
      if (mode === 'baseline') {
        setPhase('scanning');
        if (coachOn) say('baseline_eval');
        else showSubtitle('AI 검사 중…');
        await evaluateAllBaselineSlots(captures, SLOTS);
        if (!mountedRef.current) return;
        await ensureBaselineStored();
        if (!mountedRef.current) return;
        await updateFamilyProfile({ baseline_verified: true });
        if (!mountedRef.current) return;
        if (coachOn) say('baseline_pass');
        if (nextHref) router.push(nextHref);
        else onComplete?.();
        return;
      }

      if (mode === 'dirty') {
        setPhase('scanning');
        const res = await scanAllSlotCaptures(captures, SLOTS);
        if (!mountedRef.current) return;
        setScanResult(monstersToQuest(res.monsters), res.pollution, res.summary);
        if (coachOn) say('before_done');
        else showSubtitle(getCoachLine(characterId, 'before_done'));
        if (nextHref) router.push(nextHref);
        else onComplete?.();
        return;
      }

      setPhase('verifying');
      let urlsForCompare = baselineUrls;
      if (!baselineSlotsReady(baselineUrls)) {
        const loaded = await loadBaselineUrls();
        if (!mountedRef.current) return;
        urlsForCompare = loaded.urls;
        if (!baselineSlotsReady(urlsForCompare)) {
          throw new Error('부모 기준 사진 3곳·AI 검사가 완료되지 않았습니다.');
        }
        setBaselineUrls(urlsForCompare);
      }
      const res = await compareAllSlotsWithBaseline(captures, urlsForCompare, SLOTS);
      if (!mountedRef.current) return;
      setVerifyResult(res.cleanliness, res.comment);
      await patchLogMeta(todayKey, { score: res.cleanliness, streak_days: streakDays });
      if (!mountedRef.current) return;
      if (coachOn) say('after_score', { score: res.cleanliness });
      else showSubtitle(getCoachLine(characterId, 'after_score', { score: res.cleanliness }));
      if (nextHref) router.push(nextHref);
      else onComplete?.();
    } catch (e) {
      if (!mountedRef.current) return;
      const msg = e instanceof Error ? e.message : 'AI 검사에 실패했습니다.';
      if (mode === 'baseline') resetCaptures();
      showFailure(msg);
    } finally {
      if (!mountedRef.current) return;
      setProcessing(false);
    }
  };

  const onSlotCaptured = async (file: File, index: number) => {
    if (!mountedRef.current) return;
    setError('');
    setProcessing(true);
    try {
      const phase = mode === 'dirty' ? 'before' : mode === 'after' ? 'after' : 'baseline';
      await persistCapture(file, phase, index);

      const nextCaptures = [...slotCaptures];
      nextCaptures[index] = file;
      setSlotCaptures(nextCaptures);

      if (index < SLOT_COUNT - 1) {
        if (!mountedRef.current) return;
        const next = index + 1;
        setGhostAligned(false);
        goToSlot(next);
        say('slot_done', { slotIndex: index });
        return;
      }

      if (nextCaptures.some((c) => !c || c.size === 0)) {
        throw new Error('3곳 사진이 모두 필요합니다.');
      }
      await finalizeAllSlots(nextCaptures);
    } catch (e) {
      if (!mountedRef.current) return;
      const msg = e instanceof Error ? e.message : '저장에 실패했습니다.';
      showFailure(msg);
    } finally {
      if (!mountedRef.current) return;
      setProcessing(false);
    }
  };

  const onPhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || slotCaptures[slotIdx]) return;
    if (coachOn) say('shutter', { slotIndex: slotIdx });
    void onSlotCaptured(file, slotIdx);
    e.target.value = '';
  };

  const captureLabel = processing
    ? slotsDone === SLOT_COUNT
      ? 'AI 검사 중…'
      : '저장 중…'
    : slotCaptures[slotIdx]
      ? `${SLOTS[slotIdx]} 완료`
      : `${SLOTS[slotIdx]} 사진 찍기`;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#2f3438] px-5 py-4 text-white">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CoachAvatar characterId={characterId} size="md" />
          <div>
            <h1 className="text-base font-bold">{modeTitle(mode)}</h1>
            <p className="text-[10px] text-white/60">안내 · {coachMeta.name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleCoach}
          aria-pressed={coachOn}
          aria-label={coachOn ? '음성 안내 끄기' : '음성 안내 켜기'}
          className={`rounded-full px-3 py-1 text-[10px] font-bold ${coachOn ? 'bg-[#00b8cf] text-white' : 'bg-white/15'}`}
        >
          안내 {coachOn ? 'ON' : 'OFF'}
        </button>
      </div>

      <p className="mt-2 text-sm text-white/70">
        {slotsDone}/{SLOT_COUNT}곳 · 사진 1장 × 3
        {mode === 'after' && !baselineSlotsReady(baselineUrls) && ' · 기준 사진 없음'}
      </p>

      {error && (
        <p className="mt-2 rounded-lg bg-[#f04452]/20 px-3 py-2 text-xs text-[#ffc9c9]">{error}</p>
      )}

      <div className="relative mt-3 flex min-h-[48dvh] flex-1 flex-col overflow-hidden rounded-2xl border-2 border-[#00b8cf]/50 bg-black">
        {!slotCaptures[slotIdx] && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white/60">
            {SLOTS[slotIdx]} 사진을 촬영해 주세요
          </div>
        )}
        {showGhostMedia && ghostUrl && (
          <GhostBaselineMedia url={ghostUrl} onError={() => setGhostMediaFailed(true)} />
        )}
        {ghostMediaBroken && <GhostBaselineUnavailable />}
        {ghostMediaMissing && <GhostBaselineMissingHint />}
        {!!ghostUrl && !ghostMediaFailed && <GhostSlotGuide slotIdx={ghostSlot} />}
        <GhostAlignmentBar
          slotIdx={ghostSlot}
          aligned={ghostAligned}
          onAlignedChange={setGhostAligned}
          showGhost={showGhostMedia}
        />
        <GhostSlotBadge slotIdx={ghostSlot} showGhost={showGhostMedia} />
        <GhostBottomCue slotIdx={ghostSlot} showGhost={showGhostMedia} />
        <CoachSubtitle
          text={subtitle}
          placeholder={subtitlePlaceholder(showGhostMedia, slotIdx)}
          priority={error ? 'assertive' : 'polite'}
        />
        <p className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/80">
          {slotIdx + 1}/{SLOT_COUNT} · {SLOTS[slotIdx]}
        </p>
      </div>

      <div className="mt-3 flex gap-2">
        {SLOTS.map((s, i) => {
          const done = !!slotCaptures[i];
          const active = i === slotIdx && !done;
          const hasBaseline = !!baselineUrls[i];
          return (
            <button
              key={s}
              type="button"
              disabled={done || processing}
              onClick={() => {
                if (!done && !processing) goToSlot(i);
              }}
              className={`flex-1 rounded-lg py-2 text-center text-[10px] font-semibold leading-tight disabled:opacity-70 ${
                done ? 'bg-[#00c73c] text-white' : active ? 'bg-[#00b8cf] text-white' : 'bg-white/10 text-white/60'
              }`}
            >
              {done ? '✓ ' : ''}
              {ghostSlotConfig(i).tabLabel}
              {mode !== 'baseline' && !hasBaseline && !done && (
                <span className="mt-0.5 block text-[9px] font-normal text-[#ffc9c9]">기준 없음</span>
              )}
            </button>
          );
        })}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPhotoPick}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={processing || !!slotCaptures[slotIdx]}
        className="ch-btn-primary mt-4 py-4 text-sm disabled:opacity-60"
      >
        {captureLabel}
      </button>

      <AiModelAlert open={alertOpen} message={alertMessage} onClose={() => setAlertOpen(false)} />
    </div>
  );
}
