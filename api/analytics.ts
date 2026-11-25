import {
  checkRateLimit,
  getMuseumAnalytics,
  incrementExhibitLike,
  recordMuseumVisit,
} from './_lib/storage.js';
import { sanitizeExhibitId } from './_lib/validation.js';
import { getClientKey, handlePreflight, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from './_lib/http.js';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (handlePreflight(req, res, 'GET, POST, OPTIONS')) return;
  if (req.method === 'GET') {
    try {
      const analytics = await getMuseumAnalytics();
      sendJson(res, 200, analytics);
    } catch (err) {
      console.error('GET /api/analytics error:', err);
      sendJson(res, 500, { error: 'Không thể tải thống kê phòng trưng bày.' });
    }
    return;
  }

  if (req.method === 'POST') {
    const clientKey = getClientKey(req);
    if (!checkRateLimit(clientKey, 'analytics-post', 30, 60_000)) {
      sendJson(res, 429, { error: 'Thao tác quá nhanh, vui lòng thử lại sau ít giây.' });
      return;
    }

    let parsedBody: unknown;
    try {
      parsedBody = await readJsonBody(req, 4096);
    } catch {
      sendJson(res, 400, { error: 'Định dạng JSON không hợp lệ.' });
      return;
    }

    const record = parsedBody as Record<string, unknown> | null;
    const type = typeof record?.type === 'string' ? record.type : '';

    try {
      if (type === 'visit') {
        const analytics = await recordMuseumVisit();
        sendJson(res, 200, analytics);
        return;
      }

      if (type === 'like') {
        const exhibitId = sanitizeExhibitId(record?.exhibitId);
        if (!exhibitId) {
          sendJson(res, 400, { error: 'Thiếu mã hiện vật hợp lệ.' });
          return;
        }
        const analytics = await incrementExhibitLike(exhibitId);
        sendJson(res, 200, analytics);
        return;
      }

      sendJson(res, 400, { error: 'Loại sự kiện thống kê không hợp lệ.' });
    } catch (err) {
      console.error('POST /api/analytics error:', err);
      sendJson(res, 500, { error: 'Không thể cập nhật thống kê phòng trưng bày.' });
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  sendJson(res, 405, { error: 'Method Not Allowed' });
}
