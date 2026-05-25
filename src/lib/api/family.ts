import { fetchJson } from '@/lib/api/fetchJson';
import { authHeaders } from '@/lib/api/authSession';

export type FamilySummary = {
  child_display_name: string;
  points_balance: number;
  base_clean_won: number;
  streak_days: number;
  streak_mult: number;
  lock_time: string;
  lock_days: string;
  lock_dates?: string;
  pass_score: number;
  allowed_numbers?: { name: string; number: string }[];
  onboard_done: boolean;
  today_score: number;
  baseline_url: string | null;
  baseline_urls: (string | null)[];
  baseline_verified: boolean;
  coach_character_id?: string;
  child_coach_character_id?: string | null;
  effective_coach_character_id?: string;
  coach_informal_mode?: boolean;
  child_coach_informal_mode?: boolean | null;
  effective_informal_mode?: boolean;
  persona_history_unseen?: number;
};

export async function fetchFamilySummary() {
  return fetchJson<FamilySummary>('/api/v1/family/summary', {
    headers: authHeaders(),
  });
}

export async function updateFamilyProfile(body: Record<string, unknown>) {
  return fetchJson<Record<string, unknown>>('/api/v1/family/summary', {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
}
