import { fetchJson } from '@/lib/api/fetchJson';
import { authHeaders } from '@/lib/api/authSession';

export type LockPolicy = {
  lock_time: string;
  lock_days: string;
  lock_dates?: string;
  pass_score: number;
  allow_phone: boolean;
  allowlist: string[];
  allowed_numbers?: { name: string; number: string }[];
};

export async function fetchLockPolicy() {
  return fetchJson<LockPolicy>('/api/v1/lock/policy', { headers: authHeaders() });
}

export async function updateLockPolicy(payload: Partial<LockPolicy>) {
  return fetchJson<LockPolicy>('/api/v1/lock/policy', {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}
