import { getActiveStorageMode } from './_lib/storage';
import { sendJson, type ApiRequest, type ApiResponse } from './_lib/http';

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  sendJson(res, 200, {
    status: 'ok',
    service: 'techtonic-heritage-room-api',
    storage: getActiveStorageMode(),
    timestamp: new Date().toISOString(),
  });
}
