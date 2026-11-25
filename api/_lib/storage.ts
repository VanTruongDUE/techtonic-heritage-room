import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  GuestbookCreateInput,
  GuestbookEntry,
  GuestbookStorageMode,
  MuseumAnalyticsPayload,
} from '../../src/types/heritage.js';
import { GUESTBOOK_ENTRIES_SEED } from '../../src/data/heritageSeed.js';

const KV_GUESTBOOK_KEY = 'techtonic:heritage:guestbook:v2';
const KV_ANALYTICS_KEY = 'techtonic:heritage:analytics:v1';
const MAX_ENTRIES = 150;
const LOCAL_GUESTBOOK_FILE = path.resolve(process.cwd(), '.data', 'guestbook.json');
const LOCAL_ANALYTICS_FILE = path.resolve(process.cwd(), '.data', 'analytics.json');

interface PersistedAnalytics {
  totalVisits: number;
  exhibitLikes: Record<string, number>;
}

const DEFAULT_ANALYTICS: PersistedAnalytics = {
  totalVisits: 136,
  exhibitLikes: {
    'exhibit-1': 28,
    'exhibit-2': 22,
    'exhibit-3': 19,
    'exhibit-4': 17,
    'mission-statement': 35,
    'vitrine-website-techtonic': 21,
    'vitrine-facebook-techtonic': 18,
    'vitrine-drive-archive': 26,
    'vitrine-minigame-puzzle': 24,
    'pedestal-btt-1': 15,
    'pedestal-bcm-1': 16,
  },
};

// Recent duplicate submission guard (prevents accidental double-clicks within 15s)
const recentSubmissionHashes = new Map<string, number>();

export function isDuplicateSubmission(clientKey: string, fingerprint: string, windowMs = 15_000): boolean {
  const now = Date.now();
  if (recentSubmissionHashes.size > 200) {
    for (const [k, ts] of recentSubmissionHashes) {
      if (now - ts > windowMs) recentSubmissionHashes.delete(k);
    }
  }
  const key = `${clientKey}:${fingerprint}`;
  const last = recentSubmissionHashes.get(key);
  if (last && now - last < windowMs) {
    return true;
  }
  recentSubmissionHashes.set(key, now);
  return false;
}

// Module-level fallback stores for warm serverless instances without KV/writable FS
let memoryEntries: GuestbookEntry[] = GUESTBOOK_ENTRIES_SEED.map((e, idx) => ({
  ...e,
  tag: e.tag ?? (idx % 2 === 0 ? 'Lời chúc' : 'Kỷ niệm'),
  likes: e.likes ?? 6 - (idx % 4),
}));
let memoryAnalytics: PersistedAnalytics = {
  totalVisits: DEFAULT_ANALYTICS.totalVisits,
  exhibitLikes: { ...DEFAULT_ANALYTICS.exhibitLikes },
};

// Sliding-window rate limits per client key & bucket
const rateBuckets = new Map<string, number[]>();

export function checkRateLimit(
  clientKey: string,
  bucket = 'guestbook',
  maxRequests = 6,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  if (rateBuckets.size > 300) {
    for (const [k, timestamps] of rateBuckets) {
      const alive = timestamps.filter((ts) => now - ts < windowMs);
      if (alive.length === 0) {
        rateBuckets.delete(k);
      } else {
        rateBuckets.set(k, alive);
      }
    }
  }
  const key = `${bucket}:${clientKey}`;
  const recent = (rateBuckets.get(key) ?? []).filter((ts) => now - ts < windowMs);
  if (recent.length >= maxRequests) {
    rateBuckets.set(key, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  return true;
}

function getKvConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

async function kvGetJson<T>(kv: { url: string; token: string }, key: string): Promise<T | null> {
  const res = await fetch(`${kv.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${kv.token}` },
  });
  if (!res.ok) throw new Error(`KV GET failed (${res.status})`);
  const payload = (await res.json()) as { result?: string | null };
  if (!payload.result) return null;
  return JSON.parse(payload.result) as T;
}

async function kvSetJson<T>(kv: { url: string; token: string }, key: string, value: T): Promise<void> {
  const res = await fetch(`${kv.url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kv.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(JSON.stringify(value)),
  });
  if (!res.ok) throw new Error(`KV SET failed (${res.status})`);
}

async function readLocalJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeLocalJson<T>(filePath: string, data: T): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function normalizeEntries(entries: GuestbookEntry[]): GuestbookEntry[] {
  return entries.map((e) => ({
    ...e,
    tag: e.tag ?? 'Lời chúc',
    likes: typeof e.likes === 'number' && Number.isFinite(e.likes) ? Math.max(0, e.likes) : 0,
  }));
}

export function getActiveStorageMode(): GuestbookStorageMode {
  if (getKvConfig()) return 'kv';
  if (process.env.VERCEL !== '1') return 'file';
  return 'memory';
}

export async function listGuestbookEntries(): Promise<{
  entries: GuestbookEntry[];
  storage: GuestbookStorageMode;
}> {
  const kv = getKvConfig();
  if (kv) {
    try {
      const existing = await kvGetJson<GuestbookEntry[]>(kv, KV_GUESTBOOK_KEY);
      if (Array.isArray(existing) && existing.length > 0) {
        return { entries: normalizeEntries(existing), storage: 'kv' };
      }
      await kvSetJson(kv, KV_GUESTBOOK_KEY, memoryEntries);
      return { entries: [...memoryEntries], storage: 'kv' };
    } catch (err) {
      console.warn('KV read fallback to memory:', err);
    }
  }

  if (process.env.VERCEL !== '1') {
    const fileEntries = await readLocalJson<GuestbookEntry[]>(LOCAL_GUESTBOOK_FILE);
    if (Array.isArray(fileEntries) && fileEntries.length > 0) {
      memoryEntries = normalizeEntries(fileEntries);
      return { entries: memoryEntries, storage: 'file' };
    }
    const created = await writeLocalJson(LOCAL_GUESTBOOK_FILE, memoryEntries);
    if (created) {
      return { entries: [...memoryEntries], storage: 'file' };
    }
  }

  return { entries: [...memoryEntries], storage: 'memory' };
}

export async function appendGuestbookEntry(input: GuestbookCreateInput): Promise<{
  entry: GuestbookEntry;
  storage: GuestbookStorageMode;
}> {
  const newEntry: GuestbookEntry = {
    id: `gb-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
    author: input.author,
    roleOrAffiliation: input.roleOrAffiliation,
    message: input.message,
    tag: input.tag ?? 'Lời chúc',
    likes: 0,
    timestamp: new Date().toISOString().split('T')[0],
  };

  const kv = getKvConfig();
  if (kv) {
    try {
      const current = (await kvGetJson<GuestbookEntry[]>(kv, KV_GUESTBOOK_KEY)) ?? [...memoryEntries];
      const next = [newEntry, ...normalizeEntries(current)].slice(0, MAX_ENTRIES);
      await kvSetJson(kv, KV_GUESTBOOK_KEY, next);
      return { entry: newEntry, storage: 'kv' };
    } catch (err) {
      console.warn('KV write fallback to memory:', err);
    }
  }

  if (process.env.VERCEL !== '1') {
    const current = (await readLocalJson<GuestbookEntry[]>(LOCAL_GUESTBOOK_FILE)) ?? [...memoryEntries];
    const next = [newEntry, ...normalizeEntries(current)].slice(0, MAX_ENTRIES);
    memoryEntries = next;
    const saved = await writeLocalJson(LOCAL_GUESTBOOK_FILE, next);
    if (saved) {
      return { entry: newEntry, storage: 'file' };
    }
  }

  memoryEntries = [newEntry, ...memoryEntries].slice(0, MAX_ENTRIES);
  return { entry: newEntry, storage: 'memory' };
}

export async function likeGuestbookEntry(entryId: string): Promise<{
  entry: GuestbookEntry | null;
  storage: GuestbookStorageMode;
}> {
  const { entries, storage } = await listGuestbookEntries();
  let updated: GuestbookEntry | null = null;
  const next = entries.map((item) => {
    if (item.id === entryId) {
      updated = { ...item, likes: (item.likes ?? 0) + 1 };
      return updated;
    }
    return item;
  });

  if (!updated) {
    return { entry: null, storage };
  }

  const kv = getKvConfig();
  if (kv && storage === 'kv') {
    try {
      await kvSetJson(kv, KV_GUESTBOOK_KEY, next);
      return { entry: updated, storage: 'kv' };
    } catch (err) {
      console.warn('KV like write fallback:', err);
    }
  }

  memoryEntries = next;
  if (process.env.VERCEL !== '1') {
    const saved = await writeLocalJson(LOCAL_GUESTBOOK_FILE, next);
    if (saved) {
      return { entry: updated, storage: 'file' };
    }
  }

  return { entry: updated, storage: 'memory' };
}

async function loadRawAnalytics(): Promise<{ data: PersistedAnalytics; storage: GuestbookStorageMode }> {
  const kv = getKvConfig();
  if (kv) {
    try {
      const existing = await kvGetJson<PersistedAnalytics>(kv, KV_ANALYTICS_KEY);
      if (existing && typeof existing.totalVisits === 'number') {
        return { data: existing, storage: 'kv' };
      }
      await kvSetJson(kv, KV_ANALYTICS_KEY, memoryAnalytics);
      return { data: { ...memoryAnalytics }, storage: 'kv' };
    } catch (err) {
      console.warn('KV analytics read fallback:', err);
    }
  }

  if (process.env.VERCEL !== '1') {
    const fileData = await readLocalJson<PersistedAnalytics>(LOCAL_ANALYTICS_FILE);
    if (fileData && typeof fileData.totalVisits === 'number') {
      memoryAnalytics = {
        totalVisits: fileData.totalVisits,
        exhibitLikes: { ...DEFAULT_ANALYTICS.exhibitLikes, ...(fileData.exhibitLikes ?? {}) },
      };
      return { data: memoryAnalytics, storage: 'file' };
    }
    const created = await writeLocalJson(LOCAL_ANALYTICS_FILE, memoryAnalytics);
    if (created) {
      return { data: { ...memoryAnalytics }, storage: 'file' };
    }
  }

  return { data: { ...memoryAnalytics }, storage: 'memory' };
}

async function saveRawAnalytics(
  next: PersistedAnalytics
): Promise<GuestbookStorageMode> {
  memoryAnalytics = next;
  const kv = getKvConfig();
  if (kv) {
    try {
      await kvSetJson(kv, KV_ANALYTICS_KEY, next);
      return 'kv';
    } catch (err) {
      console.warn('KV analytics write fallback:', err);
    }
  }

  if (process.env.VERCEL !== '1') {
    const saved = await writeLocalJson(LOCAL_ANALYTICS_FILE, next);
    if (saved) return 'file';
  }
  return 'memory';
}

export async function getMuseumAnalytics(): Promise<MuseumAnalyticsPayload> {
  const [{ data, storage }, guestbook] = await Promise.all([
    loadRawAnalytics(),
    listGuestbookEntries(),
  ]);
  return {
    totalVisits: data.totalVisits,
    exhibitLikes: data.exhibitLikes,
    guestbookCount: guestbook.entries.length,
    storage,
    updatedAt: new Date().toISOString(),
  };
}

export async function recordMuseumVisit(): Promise<MuseumAnalyticsPayload> {
  const [{ data }, guestbook] = await Promise.all([loadRawAnalytics(), listGuestbookEntries()]);
  const next: PersistedAnalytics = {
    totalVisits: data.totalVisits + 1,
    exhibitLikes: { ...data.exhibitLikes },
  };
  const storage = await saveRawAnalytics(next);
  return {
    totalVisits: next.totalVisits,
    exhibitLikes: next.exhibitLikes,
    guestbookCount: guestbook.entries.length,
    storage,
    updatedAt: new Date().toISOString(),
  };
}

export async function incrementExhibitLike(exhibitId: string): Promise<MuseumAnalyticsPayload> {
  const [{ data }, guestbook] = await Promise.all([loadRawAnalytics(), listGuestbookEntries()]);
  const nextLikes = {
    ...data.exhibitLikes,
    [exhibitId]: (data.exhibitLikes[exhibitId] ?? 0) + 1,
  };
  const next: PersistedAnalytics = {
    totalVisits: data.totalVisits,
    exhibitLikes: nextLikes,
  };
  const storage = await saveRawAnalytics(next);
  return {
    totalVisits: next.totalVisits,
    exhibitLikes: next.exhibitLikes,
    guestbookCount: guestbook.entries.length,
    storage,
    updatedAt: new Date().toISOString(),
  };
}
