import {
  appendGuestbookEntry,
  checkRateLimit,
  likeGuestbookEntry,
  listGuestbookEntries,
} from './_lib/storage.js';
import { sanitizeExhibitId, sanitizeText, validateGuestbookInput } from './_lib/validation.js';
import {
  getClientKey,
  getQueryParams,
  readJsonBody,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './_lib/http.js';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method === 'GET') {
    try {
      const result = await listGuestbookEntries();
      const params = getQueryParams(req);
      const query = sanitizeText(params.get('q') ?? '', 80).toLowerCase();
      const tag = sanitizeText(params.get('tag') ?? '', 32);

      let filtered = result.entries;
      if (tag && tag !== 'all') {
        filtered = filtered.filter((e) => (e.tag ?? 'Lời chúc') === tag);
      }
      if (query) {
        filtered = filtered.filter(
          (e) =>
            e.author.toLowerCase().includes(query) ||
            e.roleOrAffiliation.toLowerCase().includes(query) ||
            e.message.toLowerCase().includes(query)
        );
      }

      sendJson(res, 200, {
        entries: filtered,
        total: result.entries.length,
        storage: result.storage,
      });
    } catch (err) {
      console.error('GET /api/guestbook error:', err);
      sendJson(res, 500, { error: 'Không thể tải danh sách sổ lưu bút.' });
    }
    return;
  }

  if (req.method === 'POST') {
    const clientKey = getClientKey(req);
    if (!checkRateLimit(clientKey, 'guestbook-post', 5, 60_000)) {
      sendJson(res, 429, {
        error: 'Bạn gửi quá nhanh. Vui lòng đợi ít giây trước khi gửi lời chúc tiếp theo.',
      });
      return;
    }

    let parsedBody: unknown;
    try {
      parsedBody = await readJsonBody(req);
    } catch (err) {
      if (err instanceof Error && err.message === 'PAYLOAD_TOO_LARGE') {
        sendJson(res, 413, { error: 'Nội dung gửi lên vượt quá giới hạn cho phép.' });
        return;
      }
      sendJson(res, 400, { error: 'Định dạng JSON không hợp lệ.' });
      return;
    }

    const validation = validateGuestbookInput(parsedBody);
    if (!validation.valid || !validation.data) {
      sendJson(res, 400, validation.error ?? { error: 'Dữ liệu không hợp lệ.' });
      return;
    }

    try {
      const result = await appendGuestbookEntry(validation.data);
      sendJson(res, 201, result);
    } catch (err) {
      console.error('POST /api/guestbook error:', err);
      sendJson(res, 500, { error: 'Không thể lưu lời chúc. Vui lòng thử lại.' });
    }
    return;
  }

  if (req.method === 'PATCH') {
    const clientKey = getClientKey(req);
    if (!checkRateLimit(clientKey, 'guestbook-like', 20, 60_000)) {
      sendJson(res, 429, { error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau giây lát.' });
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
    const id = sanitizeExhibitId(record?.id);
    if (!id) {
      sendJson(res, 400, { error: 'Thiếu mã lời chúc hợp lệ.' });
      return;
    }

    try {
      const result = await likeGuestbookEntry(id);
      if (!result.entry) {
        sendJson(res, 404, { error: 'Không tìm thấy lời chúc.' });
        return;
      }
      sendJson(res, 200, result);
    } catch (err) {
      console.error('PATCH /api/guestbook error:', err);
      sendJson(res, 500, { error: 'Không thể cập nhật lượt yêu thích.' });
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  sendJson(res, 405, { error: 'Method Not Allowed' });
}
