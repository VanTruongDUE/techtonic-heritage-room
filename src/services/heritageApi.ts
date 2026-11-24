import { GUESTBOOK_ENTRIES_SEED } from '../data/heritageSeed';
import type {
  ApiErrorResponse,
  GuestbookCreateInput,
  GuestbookCreateResponse,
  GuestbookEntry,
  GuestbookListResponse,
  HeritageDataPayload,
} from '../types/heritage';

const LOCAL_GUESTBOOK_KEY = 'techtonic_heritage_guestbook_v1';
const REQUEST_TIMEOUT_MS = 6000;

export class ApiRequestError extends Error {
  status: number;
  fieldErrors?: ApiErrorResponse['fieldErrors'];

  constructor(message: string, status: number, fieldErrors?: ApiErrorResponse['fieldErrors']) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function readLocalGuestbook(): GuestbookEntry[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_GUESTBOOK_KEY);
    if (!raw) return [...GUESTBOOK_ENTRIES_SEED];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as GuestbookEntry[])
      : [...GUESTBOOK_ENTRIES_SEED];
  } catch {
    return [...GUESTBOOK_ENTRIES_SEED];
  }
}

function writeLocalGuestbook(entries: GuestbookEntry[]): void {
  try {
    window.localStorage.setItem(LOCAL_GUESTBOOK_KEY, JSON.stringify(entries.slice(0, 100)));
  } catch {
    // Ignore storage quota errors in restricted browsing modes
  }
}

export async function fetchHeritageData(): Promise<HeritageDataPayload> {
  const res = await fetchWithTimeout('/api/heritage');
  if (!res.ok) {
    throw new ApiRequestError('Không thể tải dữ liệu triển lãm từ máy chủ.', res.status);
  }
  return (await res.json()) as HeritageDataPayload;
}

export async function fetchGuestbook(): Promise<GuestbookListResponse> {
  try {
    const res = await fetchWithTimeout('/api/guestbook');
    if (!res.ok) {
      throw new ApiRequestError('Không thể tải sổ lưu bút.', res.status);
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new ApiRequestError('Phản hồi không hợp lệ từ máy chủ.', 502);
    }
    const data = (await res.json()) as GuestbookListResponse;
    writeLocalGuestbook(data.entries);
    return data;
  } catch {
    return {
      entries: readLocalGuestbook(),
      storage: 'local',
    };
  }
}

export async function createGuestbookEntry(
  input: GuestbookCreateInput
): Promise<GuestbookCreateResponse> {
  try {
    const res = await fetchWithTimeout('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new ApiRequestError('Máy chủ không khả dụng, chuyển sang lưu cục bộ.', 502);
    }

    const body = (await res.json()) as GuestbookCreateResponse | ApiErrorResponse;
    if (!res.ok) {
      const errBody = body as ApiErrorResponse;
      throw new ApiRequestError(
        errBody.error || 'Không thể gửi lời chúc.',
        res.status,
        errBody.fieldErrors
      );
    }

    const created = body as GuestbookCreateResponse;
    const current = readLocalGuestbook();
    writeLocalGuestbook([created.entry, ...current.filter((e) => e.id !== created.entry.id)]);
    return created;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status >= 400 && err.status < 500) {
      throw err;
    }

    const fallbackEntry: GuestbookEntry = {
      id: `gb-local-${Date.now()}`,
      author: input.author.trim(),
      roleOrAffiliation: input.roleOrAffiliation.trim() || 'Khách tham quan',
      message: input.message.trim(),
      timestamp: new Date().toISOString().split('T')[0],
    };
    const next = [fallbackEntry, ...readLocalGuestbook()];
    writeLocalGuestbook(next);
    return {
      entry: fallbackEntry,
      storage: 'local',
    };
  }
}
