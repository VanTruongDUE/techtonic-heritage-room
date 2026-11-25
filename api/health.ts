import { getActiveStorageMode, getMuseumAnalytics } from './_lib/storage.js';
import { handlePreflight, sendJson, type ApiRequest, type ApiResponse } from './_lib/http.js';

const BOOT_TIME_MS = Date.now();

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (handlePreflight(req, res, 'GET, OPTIONS')) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  const analytics = await getMuseumAnalytics();
  sendJson(res, 200, {
    status: 'ok',
    version: '2.5.0',
    service: 'techtonic-heritage-room-api',
    storage: getActiveStorageMode(),
    uptimeSec: Math.max(0, Math.round((Date.now() - BOOT_TIME_MS) / 1000)),
    ecosystem: {
      departments: 5,
      photoPedestals: 37,
      digitalVitrines: 4,
      mascotsAndArtifacts: 5,
      testimonials: 4,
    },
    metrics: {
      totalVisits: analytics.totalVisits,
      guestbookCount: analytics.guestbookCount,
      totalExhibitLikes: Object.values(analytics.exhibitLikes).reduce((sum, n) => sum + n, 0),
    },
    timestamp: new Date().toISOString(),
  });
}
