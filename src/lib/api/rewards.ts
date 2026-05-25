import { fetchJson } from '@/lib/api/fetchJson';
import { authHeaders } from '@/lib/api/authSession';

export type ShopReward = {
  id: string;
  label: string;
  won: number;
};

export type DailyQuest = {
  id: string;
  title: string;
  description: string;
  active: boolean;
  reward_won: number;
};

export type DailyQuestListResponse = {
  quests: DailyQuest[];
};

export type CompleteDailyQuestResponse = {
  ok: boolean;
  already_done?: boolean;
  reward_won?: number;
  balance?: number;
};

export async function fetchShopRewards() {
  return fetchJson<{ rewards: ShopReward[] }>('/api/v1/rewards/shop', {
    headers: authHeaders(),
  });
}

export async function createShopReward(label: string, won: number) {
  return fetchJson<{ rewards: ShopReward[] }>('/api/v1/rewards/shop', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ label, won }),
  });
}

export async function updateShopReward(id: string, payload: { label?: string; won?: number }) {
  return fetchJson<{ rewards: ShopReward[] }>(`/api/v1/rewards/shop/${id}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export async function deleteShopReward(id: string) {
  return fetchJson<{ rewards: ShopReward[] }>(`/api/v1/rewards/shop/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function fetchDailyQuests() {
  return fetchJson<DailyQuestListResponse>('/api/v1/rewards/daily-quests', {
    headers: authHeaders(),
  });
}

export async function createDailyQuest(title: string, description = '', reward_won = 1000) {
  return fetchJson<DailyQuestListResponse>('/api/v1/rewards/daily-quests', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, description, reward_won }),
  });
}

export async function deleteDailyQuest(id: string) {
  return fetchJson<DailyQuestListResponse>(`/api/v1/rewards/daily-quests/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function completeDailyQuest(id: string) {
  return fetchJson<CompleteDailyQuestResponse>(`/api/v1/rewards/daily-quests/${id}/complete`, {
    method: 'POST',
    headers: authHeaders(),
  });
}
