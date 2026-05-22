'use client';

import { playSfx } from '@/lib/chungsora/sfx';
import type { TtsScriptSegment } from '@/lib/api/tts';

export type ScriptCancelToken = { cancelled: boolean };

function pickKoreanVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  const ko = voices.filter((v) => v.lang.toLowerCase().startsWith('ko'));
  if (!ko.length) return undefined;
  const local = ko.find((v) => v.localService);
  const named = ko.find((v) => /yuna|heera|nara|google|microsoft/i.test(v.name));
  return local ?? named ?? ko[0];
}

function wait(ms: number, cancel: ScriptCancelToken): Promise<void> {
  return new Promise((resolve) => {
    if (ms <= 0) {
      resolve();
      return;
    }
    const t = setTimeout(resolve, ms);
    const iv = setInterval(() => {
      if (cancel.cancelled) {
        clearTimeout(t);
        clearInterval(iv);
        resolve();
      }
    }, 50);
    setTimeout(() => clearInterval(iv), ms + 60);
  });
}

/** 한 문장을 말하고 끝나면 resolve (안전 타임아웃 포함) */
function speakOne(text: string, rate: number, cancel: ScriptCancelToken): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || cancel.cancelled) {
      resolve();
      return;
    }
    const syn = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = rate;
    const voice = pickKoreanVoice();
    if (voice) u.voice = voice;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    // 발화 길이 추정 안전 타임아웃 (글자수 기반)
    const safetyMs = Math.min(12000, 1200 + text.length * 130);
    setTimeout(finish, safetyMs);
    syn.speak(u);
  });
}

/**
 * 백엔드 /tts/script 세그먼트를 순서대로 재생.
 * - tts: 기기 TTS 로 text 재생 후 pause_after_ms 대기
 * - sfx: ding 효과음 재생 후 pause_after_ms(기본 300ms) 대기
 * enabled=false 면 음성 없이 자막만 갱신하며 진행.
 */
export async function playScriptSegments(
  segments: TtsScriptSegment[],
  opts: {
    rate: number;
    enabled: boolean;
    onSubtitle?: (text: string) => void;
    cancel: ScriptCancelToken;
  },
): Promise<void> {
  for (const seg of segments) {
    if (opts.cancel.cancelled) return;
    if (seg.type === 'tts' && seg.text) {
      opts.onSubtitle?.(seg.text);
      if (opts.enabled) {
        await speakOne(seg.text, opts.rate, opts.cancel);
      } else {
        await wait(700, opts.cancel);
      }
    } else if (seg.type === 'sfx') {
      if (opts.enabled) {
        await playSfx(seg.sfx_key);
      }
    }
    if (opts.cancel.cancelled) return;
    await wait(seg.pause_after_ms || (seg.type === 'sfx' ? 300 : 0), opts.cancel);
  }
}
