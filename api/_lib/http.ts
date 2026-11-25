import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ApiRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

export interface ApiResponse extends ServerResponse {
  status?: (code: number) => ApiResponse;
  json?: (body: unknown) => void;
}

export function getQueryParams(req: ApiRequest): URLSearchParams {
  const url = req.url || '';
  const idx = url.indexOf('?');
  return new URLSearchParams(idx >= 0 ? url.slice(idx + 1) : '');
}

export function getClientKey(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'local';
}

export async function readJsonBody(req: ApiRequest, maxBytes = 16_384): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body);
    }
    return req.body;
  }

  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    total += buf.length;
    if (total > maxBytes) {
      throw new Error('PAYLOAD_TOO_LARGE');
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

export function handlePreflight(req: ApiRequest, res: ApiResponse, allowedMethods: string): boolean {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', allowedMethods);
    res.setHeader('Access-Control-Allow-Methods', allowedMethods);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

export function sendJson(
  res: ApiResponse,
  statusCode: number,
  body: unknown,
  cacheControl = 'no-store'
): void {
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  const statusFn = res.status;
  if (typeof statusFn === 'function') {
    const chained = statusFn.call(res, statusCode);
    const jsonFn = chained?.json;
    if (typeof jsonFn === 'function') {
      jsonFn.call(chained, body);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
