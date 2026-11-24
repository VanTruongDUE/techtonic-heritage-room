import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  GuestbookCreateInput,
  GuestbookEntry,
  GuestbookStorageMode,
} from '../../src/types/heritage';
import { GUESTBOOK_ENTRIES_SEED } from '../../src/data/heritageSeed';

const KV_KEY = 'techtonic:heritage:guestbook:v1';
const MAX_ENTRIES = 100;
const LOCAL_DATA_FILE = path.resolve(process.cwd(), '.data', 'guestbook.json');

// Module-level fallback store for warm serverless instances without KV/writable FS
let memoryEntries: GuestbookEntry[] = [...GUESTBOOK_ENTRIES_SEED];

// Simple in-memory rate limit per IP (sliding window: max 5 posts / 60s)
const rateBuckets = new Map<string, number[]>();

export function checkRateLimit(clientKey: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 5;
  const recent = (rateBuckets.get(clientKey) ?? []).filter((ts) => now - ts < windowMs);
  if (recent.length >= maxRequests) {
    rateBuckets.set(clientKey, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(clientKey, recent);
  return true;
}

function getKvConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

async function kvGetEntries(kv: { url: string; token: string }): Promise<GuestbookEntry[] | null> {
  const res = await fetch(`${kv.url}/get/${encodeURIComponent(KV_KEY)}`, {
    headers: { Authorization: `Bearer ${kv.token}` },
  });
  if (!res.ok) throw new Error(`KV GET failed (${res.status})`);
  const payload = (await res.json()) as { result?: string | null };
  if (!payload.result) return null;
  const parsed = JSON.parse(payload.result);
  return Array.isArray(parsed) ? (parsed as GuestbookEntry[]) : null;
}

async function kvSetEntries(
  kv: { url: string; token: string },
  entries: GuestbookEntry[]
): Promise<void> {
  const serialized = JSON.stringify(entries);
  const res = await fetch(`${kv.url}/set/${encodeURIComponent(KV_KEY)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kv.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(serialized),
  });
  if (!res.ok) throw new Error(`KV SET failed (${res.status})`);
}

async function readLocalFileEntries(): Promise<GuestbookEntry[] | null> {
  try {
    const raw = await fs.readFile(LOCAL_DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GuestbookEntry[]) : null;
  } catch {
    return null;
  }
}

async function writeLocalFileEntries(entries: GuestbookEntry[]): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(LOCAL_DATA_FILE), { recursive: true });
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
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
      const existing = await kvGetEntries(kv);
      if (existing && existing.length > 0) {
        return { entries: existing, storage: 'kv' };
      }
      await kvSetEntries(kv, GUESTBOOK_ENTRIES_SEED);
      return { entries: [...GUESTBOOK_ENTRIES_SEED], storage: 'kv' };
    } catch (err) {
      console.warn('KV read fallback to memory:', err);
    }
  }

  if (process.env.VERCEL !== '1') {
    const fileEntries = await readLocalFileEntries();
    if (fileEntries) {
      memoryEntries = fileEntries;
      return { entries: fileEntries, storage: 'file' };
    }
    const created = await writeLocalFileEntries(memoryEntries);
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
    timestamp: new Date().toISOString().split('T')[0],
  };

  const kv = getKvConfig();
  if (kv) {
    try {
      const current = (await kvGetEntries(kv)) ?? [...GUESTBOOK_ENTRIES_SEED];
      const next = [newEntry, ...current].slice(0, MAX_ENTRIES);
      await kvSetEntries(kv, next);
      return { entry: newEntry, storage: 'kv' };
    } catch (err) {
      console.warn('KV write fallback to memory:', err);
    }
  }

  if (process.env.VERCEL !== '1') {
    const current = (await readLocalFileEntries()) ?? [...memoryEntries];
    const next = [newEntry, ...current].slice(0, MAX_ENTRIES);
    memoryEntries = next;
    const saved = await writeLocalFileEntries(next);
    if (saved) {
      return { entry: newEntry, storage: 'file' };
    }
  }

  memoryEntries = [newEntry, ...memoryEntries].slice(0, MAX_ENTRIES);
  return { entry: newEntry, storage: 'memory' };
}
