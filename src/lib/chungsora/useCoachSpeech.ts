'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SPEAK_DELAY_MS = 100;
const IOS_RESUME_MS = 80;
const DEFAULT_RATE = 0.95;
const DEFAULT_PITCH = 1;

export type CoachSpeakOptions = {
  /** 코치 OFF여도 음성 재생 (오류 안내 등) */
  force?: boolean;
  /** 자막만 갱신, TTS 생략 */
  silent?: boolean;
  /** 안내 친구별 말속도 */
  rate?: number;
};

function pickKoreanVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const ko = voices.filter((v) => v.lang.toLowerCase().startsWith('ko'));
  if (!ko.length) return undefined;
  const local = ko.find((v) => v.localService);
  const named = ko.find((v) => /yuna|heera|nara|google|microsoft/i.test(v.name));
  return local ?? named ?? ko[0];
}

export function stopCoachSpeech(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const syn = window.speechSynthesis;
  syn.pause();
  syn.cancel();
  for (let i = 0; i < 8 && (syn.speaking || syn.pending); i += 1) {
    syn.cancel();
  }
}

function utterance(text: string, rate = DEFAULT_RATE): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = rate;
  u.pitch = DEFAULT_PITCH;
  const voice = pickKoreanVoice(window.speechSynthesis.getVoices());
  if (voice) u.voice = voice;
  return u;
}

export function primeSpeechSynthesis(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  u.lang = 'ko-KR';
  window.speechSynthesis.speak(u);
  window.speechSynthesis.cancel();
}

export function useCoachSpeech(enabled: boolean) {
  const [subtitle, setSubtitle] = useState('');
  const enabledRef = useRef(enabled);
  const activeRef = useRef(true);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iosResumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const clearPendingSpeak = useCallback(() => {
    if (delayRef.current) clearTimeout(delayRef.current);
    delayRef.current = null;
    if (iosResumeRef.current) clearTimeout(iosResumeRef.current);
    iosResumeRef.current = null;
  }, []);

  useEffect(() => {
    activeRef.current = true;
    primeSpeechSynthesis();
    const onVoices = () => primeSpeechSynthesis();
    const onPageHide = () => {
      clearPendingSpeak();
      stopCoachSpeech();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onPageHide();
    };
    window.speechSynthesis?.addEventListener('voiceschanged', onVoices);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      activeRef.current = false;
      window.speechSynthesis?.removeEventListener('voiceschanged', onVoices);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
      clearPendingSpeak();
      stopCoachSpeech();
      setSubtitle('');
    };
  }, [clearPendingSpeak]);

  const runSpeak = useCallback((text: string, rate = DEFAULT_RATE) => {
    if (!activeRef.current) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    stopCoachSpeech();
    if (iosResumeRef.current) clearTimeout(iosResumeRef.current);
    iosResumeRef.current = setTimeout(() => {
      iosResumeRef.current = null;
      if (!activeRef.current) return;
      const u = utterance(text, rate);
      window.speechSynthesis.speak(u);
    }, IOS_RESUME_MS);
  }, []);

  const speak = useCallback(
    (text: string, options?: CoachSpeakOptions) => {
      if (!activeRef.current) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      setSubtitle(trimmed);
      if (options?.silent) return;
      if (!enabledRef.current && !options?.force) return;

      clearPendingSpeak();
      const rate = options?.rate ?? DEFAULT_RATE;
      delayRef.current = setTimeout(() => {
        delayRef.current = null;
        if (!activeRef.current) return;
        runSpeak(trimmed, rate);
      }, SPEAK_DELAY_MS);
    },
    [runSpeak, clearPendingSpeak],
  );

  const showSubtitle = useCallback((text: string) => {
    const trimmed = text.trim();
    if (trimmed) setSubtitle(trimmed);
  }, []);

  const clearSubtitle = useCallback(() => setSubtitle(''), []);

  const stop = useCallback(() => {
    clearPendingSpeak();
    stopCoachSpeech();
    setSubtitle('');
  }, [clearPendingSpeak]);

  return { subtitle, speak, showSubtitle, clearSubtitle, stop };
}
