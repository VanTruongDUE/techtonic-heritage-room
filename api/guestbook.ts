import {
  appendGuestbookEntry,
  checkRateLimit,
  listGuestbookEntries,
} from './_lib/storage';
import { validateGuestbookInput } from './_lib/validation';
import { sendJson, type ApiRequest, type ApiResponse } from './_lib/http';

async function readJsonBody(req: ApiRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body);
    }
    return req.body;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    if (chunks.reduce((sum, b) => sum + b.length, 0) > 16_384) {
      throw new Error('PAYLOAD_TOO_LARGE');
    }
  }
  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

function getClientKey(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'local';
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method === 'GET') {
    try {
      const result = await listGuestbookEntries();
      sendJson(res, 200, result);
    } catch (err) {
      console.error('GET /api/guestbook error:', err);
      sendJson(res, 500, { error: 'Không thể tải danh sách sổ lưu bút.' });
    }
    return;
  }

  if (req.method === 'POST') {
    const clientKey = getClientKey(req);
    if (!checkRateLimit(clientKey)) {
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

  res.setHeader('Allow', 'GET, POST');
  sendJson(res, 405, { error: 'Method Not Allowed' });
}
