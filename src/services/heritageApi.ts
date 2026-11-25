import { GUESTBOOK_ENTRIES_SEED } from '../data/heritageSeed';
import type {
  ApiErrorResponse,
  GuestbookCreateInput,
  GuestbookCreateResponse,
  GuestbookEntry,
  GuestbookLikeResponse,
  GuestbookListResponse,
  HeritageDataPayload,
  MuseumAnalyticsPayload,
} from '../types/heritage';

const LOCAL_GUESTBOOK_KEY = 'techtonic_heritage_guestbook_v2';
const LOCAL_ANALYTICS_KEY = 'techtonic_heritage_analytics_v2';
const VISIT_SESSION_KEY = 'techtonic_heritage_visit_recorded_v2';
const REQUEST_TIMEOUT_MS = 6000;

let inflightHeritage: Promise<HeritageDataPayload> | null = null;
let inflightGuestbook: Promise<GuestbookListResponse> | null = null;
let inflightAnalytics: Promise<MuseumAnalyticsPayload> | null = null;
let inflightHealth: Promise<HealthStatusPayload | null> | null = null;

export interface HealthStatusPayload {
  status: string;
  service: string;
  version?: string;
  storage?: string;
  metrics?: {
    totalVisits: number;
    guestbookCount: number;
    totalExhibitLikes: number;
  };
  timestamp: string;
}

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
    const raw =
      window.localStorage.getItem(LOCAL_GUESTBOOK_KEY) ||
      window.localStorage.getItem('techtonic_heritage_guestbook_v1');
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
    window.localStorage.setItem(LOCAL_GUESTBOOK_KEY, JSON.stringify(entries.slice(0, 120)));
  } catch {
    // Ignore storage quota errors in restricted browsing modes
  }
}

function readLocalAnalytics(): MuseumAnalyticsPayload {
  try {
    const raw = window.localStorage.getItem(LOCAL_ANALYTICS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MuseumAnalyticsPayload>;
      return {
        totalVisits: typeof parsed.totalVisits === 'number' ? parsed.totalVisits : 128,
        exhibitLikes:
          parsed.exhibitLikes && typeof parsed.exhibitLikes === 'object'
            ? parsed.exhibitLikes
            : {
                'mission-vision': 42,
                'club-shirt-3d': 35,
                'trophy-sv-it': 29,
              },
        guestbookCount:
          typeof parsed.guestbookCount === 'number'
            ? parsed.guestbookCount
            : readLocalGuestbook().length,
        storage: 'local',
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch {
    // Fallback below
  }

  return {
    totalVisits: 128,
    exhibitLikes: {
      'mission-vision': 42,
      'club-shirt-3d': 35,
      'trophy-sv-it': 29,
    },
    guestbookCount: readLocalGuestbook().length,
    storage: 'local',
    updatedAt: new Date().toISOString(),
  };
}

function writeLocalAnalytics(payload: MuseumAnalyticsPayload): void {
  try {
    window.localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

export async function fetchHeritageData(): Promise<HeritageDataPayload> {
  if (inflightHeritage) return inflightHeritage;

  inflightHeritage = (async () => {
    try {
      const res = await fetchWithTimeout('/api/heritage');
      if (!res.ok) {
        throw new ApiRequestError('Không thể tải dữ liệu triển lãm từ máy chủ.', res.status);
      }
      return (await res.json()) as HeritageDataPayload;
    } finally {
      inflightHeritage = null;
    }
  })();

  return inflightHeritage;
}

export async function fetchGuestbook(params?: {
  q?: string;
  tag?: string;
}): Promise<GuestbookListResponse> {
  const hasFilters = Boolean(params?.q?.trim() || (params?.tag && params.tag !== 'ALL'));
  if (!hasFilters && inflightGuestbook) {
    return inflightGuestbook;
  }

  const run = async (): Promise<GuestbookListResponse> => {
    try {
      const search = new URLSearchParams();
      if (params?.q?.trim()) search.set('q', params.q.trim());
      if (params?.tag && params.tag !== 'ALL') search.set('tag', params.tag);
      const url = search.toString() ? `/api/guestbook?${search.toString()}` : '/api/guestbook';

      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        throw new ApiRequestError('Không thể tải sổ lưu bút.', res.status);
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new ApiRequestError('Phản hồi không hợp lệ từ máy chủ.', 502);
      }
      const data = (await res.json()) as GuestbookListResponse;
      if (!hasFilters) {
        writeLocalGuestbook(data.entries);
      }
      return data;
    } catch {
      let local = readLocalGuestbook();
      if (params?.tag && params.tag !== 'ALL') {
        local = local.filter((entry) => (entry.tag || 'Lời chúc') === params.tag);
      }
      if (params?.q?.trim()) {
        const needle = params.q.trim().toLowerCase();
        local = local.filter(
          (entry) =>
            entry.author.toLowerCase().includes(needle) ||
            entry.roleOrAffiliation.toLowerCase().includes(needle) ||
            entry.message.toLowerCase().includes(needle)
        );
      }
      return {
        entries: local,
        total: local.length,
        storage: 'local',
      };
    } finally {
      if (!hasFilters) {
        inflightGuestbook = null;
      }
    }
  };

  if (!hasFilters) {
    inflightGuestbook = run();
    return inflightGuestbook;
  }

  return run();
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
      tag: input.tag || 'Lời chúc',
      likes: 0,
    };
    const next = [fallbackEntry, ...readLocalGuestbook()];
    writeLocalGuestbook(next);
    return {
      entry: fallbackEntry,
      storage: 'local',
    };
  }
}

export async function likeGuestbookEntryApi(id: string): Promise<GuestbookLikeResponse | null> {
  try {
    const res = await fetchWithTimeout('/api/guestbook', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new ApiRequestError('Không thể thả tim lưu bút.', res.status);
    }

    const data = (await res.json()) as GuestbookLikeResponse;
    const current = readLocalGuestbook();
    writeLocalGuestbook(current.map((e) => (e.id === data.entry.id ? data.entry : e)));
    return data;
  } catch {
    const current = readLocalGuestbook();
    const target = current.find((e) => e.id === id);
    if (!target) return null;
    const updated: GuestbookEntry = {
      ...target,
      likes: (target.likes ?? 0) + 1,
    };
    writeLocalGuestbook(current.map((e) => (e.id === id ? updated : e)));
    return { entry: updated, storage: 'local' };
  }
}

export async function fetchMuseumAnalytics(): Promise<MuseumAnalyticsPayload> {
  if (inflightAnalytics) return inflightAnalytics;

  inflightAnalytics = (async () => {
    try {
      const res = await fetchWithTimeout('/api/analytics');
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new ApiRequestError('Không thể tải thống kê phòng trưng bày.', res.status);
      }
      const data = (await res.json()) as MuseumAnalyticsPayload;
      writeLocalAnalytics(data);
      return data;
    } catch {
      return readLocalAnalytics();
    } finally {
      inflightAnalytics = null;
    }
  })();

  return inflightAnalytics;
}

export async function recordVisitApi(): Promise<MuseumAnalyticsPayload> {
  try {
    if (window.sessionStorage.getItem(VISIT_SESSION_KEY)) {
      return await fetchMuseumAnalytics();
    }
    window.sessionStorage.setItem(VISIT_SESSION_KEY, '1');
  } catch {
    // Continue if sessionStorage is unavailable
  }

  try {
    const res = await fetchWithTimeout('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'visit' }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new ApiRequestError('Không thể ghi nhận lượt tham quan.', res.status);
    }
    const data = (await res.json()) as MuseumAnalyticsPayload;
    writeLocalAnalytics(data);
    return data;
  } catch {
    const local = readLocalAnalytics();
    const next: MuseumAnalyticsPayload = {
      ...local,
      totalVisits: local.totalVisits + 1,
      updatedAt: new Date().toISOString(),
    };
    writeLocalAnalytics(next);
    return next;
  }
}

export async function likeExhibitApi(exhibitId: string): Promise<MuseumAnalyticsPayload> {
  try {
    const res = await fetchWithTimeout('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'like', exhibitId }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new ApiRequestError('Không thể ghi nhận lượt yêu thích hiện vật.', res.status);
    }
    const data = (await res.json()) as MuseumAnalyticsPayload;
    writeLocalAnalytics(data);
    return data;
  } catch {
    const local = readLocalAnalytics();
    const next: MuseumAnalyticsPayload = {
      ...local,
      exhibitLikes: {
        ...local.exhibitLikes,
        [exhibitId]: (local.exhibitLikes[exhibitId] ?? 0) + 1,
      },
      updatedAt: new Date().toISOString(),
    };
    writeLocalAnalytics(next);
    return next;
  }
}

export async function fetchHealthStatus(): Promise<HealthStatusPayload | null> {
  if (inflightHealth) return inflightHealth;

  inflightHealth = (async () => {
    try {
      const res = await fetchWithTimeout('/api/health');
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        return null;
      }
      return (await res.json()) as HealthStatusPayload;
    } catch {
      return null;
    } finally {
      inflightHealth = null;
    }
  })();

  return inflightHealth;
}
