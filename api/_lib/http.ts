import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ApiRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

export interface ApiResponse extends ServerResponse {
  status?: (code: number) => ApiResponse;
  json?: (body: unknown) => void;
}

export function sendJson(
  res: ApiResponse,
  statusCode: number,
  body: unknown,
  cacheControl = 'no-store'
): void {
  res.setHeader('Cache-Control', cacheControl);
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
