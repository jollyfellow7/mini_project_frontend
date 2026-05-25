import { fetchJson } from '@/lib/api/fetchJson';
import { isUploadTooLargeForBff, UPLOAD_TOO_LARGE_MESSAGE } from '@/lib/api/uploadLimits';
import { authHeaders } from '@/lib/api/authSession';
import { prepareUploadFile } from '@/lib/chungsora/prepareUploadFile';
import type { ChatEntry } from '@/components/chungsora/MessageComposer';
const BASE = '/api/v1/logs';

export type LogDetail = {
  date: string;
  score: number;
  streak_days: number;
  before_url: string | null;
  after_url: string | null;
  messages: ChatEntry[];
};

export type LogMessagesResponse = {
  date: string;
  messages: ChatEntry[];
};

export type PostLogMessageResponse = {
  message: ChatEntry;
};

export type UploadLogPhotoResponse = {
  date: string;
  phase: 'before' | 'after';
  url: string;
};

export type LogCalendarResponse = {
  year_month: string;
  dates: (
    | string
    | {
        date?: string;
        log_date?: string;
        ymd?: string;
        score?: number;
      }
  )[];
  points: number;
};

const CALENDAR_CACHE_MS = 30_000;
const calendarCache = new Map<string, { at: number; data: LogCalendarResponse }>();
const calendarInFlight = new Map<string, Promise<LogCalendarResponse>>();

export async function fetchLogCalendar(year: number, month: number) {
  const ym = `${year}-${String(month).padStart(2, '0')}`;
  const cached = calendarCache.get(ym);
  const now = Date.now();
  if (cached && now - cached.at < CALENDAR_CACHE_MS) {
    return cached.data;
  }

  const pending = calendarInFlight.get(ym);
  if (pending) return pending;

  const request = fetchJson<LogCalendarResponse>(`${BASE}/calendar/${ym}`, {
    headers: authHeaders(),
  })
    .then((data) => {
      calendarCache.set(ym, { at: Date.now(), data });
      return data;
    })
    .finally(() => {
      calendarInFlight.delete(ym);
    });

  calendarInFlight.set(ym, request);
  return request;
}

export async function fetchLogDetail(date: string) {
  return fetchJson<LogDetail>(`${BASE}/${encodeURIComponent(date)}`, {
    headers: authHeaders(),
  });
}

export async function fetchLogMessages(date: string) {
  return fetchJson<LogMessagesResponse>(`${BASE}/${encodeURIComponent(date)}/messages`, {
    headers: authHeaders(),
  });
}

export async function postLogMessage(
  date: string,
  payload: { role: 'parent' | 'child'; text: string; badge?: string },
) {
  return fetchJson<PostLogMessageResponse>(`${BASE}/${encodeURIComponent(date)}/messages`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export async function uploadLogPhoto(
  date: string,
  phase: 'before' | 'after' | 'baseline',
  file: File | Blob,
  slot?: number,
) {
  const qs = new URLSearchParams({ phase });
  if (slot !== undefined) qs.set('slot', String(slot));
  const body = await prepareUploadFile(file);
  if (isUploadTooLargeForBff(body.size)) {
    throw new Error(UPLOAD_TOO_LARGE_MESSAGE);
  }
  const form = new FormData();
  form.append('file', body);
  return fetchJson<UploadLogPhotoResponse>(
    `${BASE}/${encodeURIComponent(date)}/photos?${qs.toString()}`,
    { method: 'POST', headers: authHeaders(), body: form },
  );
}

export async function patchLogMeta(
  date: string,
  payload: { score?: number; streak_days?: number },
) {
  return fetchJson<LogDetail>(`${BASE}/${encodeURIComponent(date)}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}
