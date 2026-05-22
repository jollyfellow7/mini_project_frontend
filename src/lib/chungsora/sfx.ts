'use client';

// 효과음(SFX)을 Web Audio API 로 합성 — 호스팅 에셋 없이 'ding' 재생.
// 백엔드 스크립트의 sfx_key 가 현재 'ding' 단일값이므로 이 한 종만 지원.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

/** 사용자 제스처 시점에 호출하면 모바일에서 오디오가 정상 깨어남 */
export function primeSfx(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

/** 짧은 '딩' 효과음 (두 음 종소리). Promise 는 재생 길이만큼 뒤 resolve */
export function playDing(): Promise<void> {
  return new Promise((resolve) => {
    const c = getCtx();
    if (!c) {
      resolve();
      return;
    }
    if (c.state === 'suspended') void c.resume();

    const now = c.currentTime;
    const master = c.createGain();
    master.gain.value = 0.0001;
    master.connect(c.destination);

    // 두 개의 사인파(높은 음 → 살짝 낮은 음)로 종소리 느낌
    const freqs = [1318.5, 1760]; // E6, A6
    freqs.forEach((f, i) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const start = now + i * 0.04;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
      osc.connect(g);
      g.connect(master);
      osc.start(start);
      osc.stop(start + 0.5);
    });

    master.gain.setValueAtTime(0.9, now);
    setTimeout(() => resolve(), 520);
  });
}

export function playSfx(key: string | null | undefined): Promise<void> {
  // 현재 'ding' 만 존재. 알 수 없는 키도 안전하게 ding 으로 폴백.
  return playDing();
}
