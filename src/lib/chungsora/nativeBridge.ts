/** Flutter WebView(mini_flutter_v2) ↔ PWA 브릿지 — Lock Task 해제·미션 시작 */
export function postToNative(message: 'unlock' | 'missionStart') {
  if (typeof window === 'undefined') return;
  const bridge = (window as Window & { ChungsoraNative?: { postMessage: (m: string) => void } })
    .ChungsoraNative;
  try {
    bridge?.postMessage(message);
  } catch {
    // 브라우저 단독 실행 시 무시
  }
}
