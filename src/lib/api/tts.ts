import { fetchJson } from '@/lib/api/fetchJson';
import { authHeaders } from '@/lib/api/authSession';

export type TtsPersona = {
  id: string;
  name: string;
  emoji: string;
  tone: string;
  supports_informal: boolean;
  recommended_ages: number[];
};

export type TtsPersonaListResponse = { personas: TtsPersona[] };

export type TtsScriptSegment = {
  type: 'tts' | 'sfx';
  text: string | null;
  sfx_key: string | null;
  pause_after_ms: number;
};

export type TtsScriptResponse = {
  persona_id: string;
  informal_mode: boolean;
  segments: TtsScriptSegment[];
};

export type PersonaUpdateResponse = {
  scope: 'family' | 'child';
  persona_id: string;
  informal_mode: boolean;
  effective_coach_character_id?: string | null;
  effective_informal_mode?: boolean | null;
};

export type PersonaHistoryItem = {
  id: number;
  changed_by: 'parent' | 'child';
  scope: 'family' | 'child';
  from_persona: string | null;
  to_persona: string;
  from_informal: boolean | null;
  to_informal: boolean;
  parent_seen: boolean;
  at: string;
};

export type PersonaHistoryResponse = {
  items: PersonaHistoryItem[];
  unseen_count: number;
};

/** 설정 화면 — 페르소나 목록 (백엔드 단일 원천) */
export async function fetchTtsPersonas() {
  return fetchJson<TtsPersonaListResponse>('/api/v1/tts/personas', {
    headers: authHeaders(),
  });
}

/** 촬영 세션 진입 시 1회 — 페르소나/반말 반영된 스크립트 세그먼트 */
export async function fetchTtsScript(personaId: string, informalMode: boolean) {
  return fetchJson<TtsScriptResponse>('/api/v1/tts/script', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ persona_id: personaId, informal_mode: informalMode }),
  });
}

/** 안내 친구 변경 — 부모면 family 기본, 자녀면 자녀 오버라이드 (백엔드가 토큰으로 판별) */
export async function updatePersona(personaId: string, informalMode: boolean) {
  return fetchJson<PersonaUpdateResponse>('/api/v1/tts/persona', {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ persona_id: personaId, informal_mode: informalMode }),
  });
}

export async function fetchPersonaHistory() {
  return fetchJson<PersonaHistoryResponse>('/api/v1/tts/persona-history', {
    headers: authHeaders(),
  });
}

/** 부모가 변경 알림 확인 → unseen 해제 */
export async function markPersonaHistorySeen() {
  return fetchJson<PersonaHistoryResponse>('/api/v1/tts/persona-history/seen', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
  });
}
