import { getActiveStorageMode, getMuseumAnalytics } from './_lib/storage';
import { sendJson, type ApiRequest, type ApiResponse } from './_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  const analytics = await getMuseumAnalytics();
  sendJson(res, 200, {
    status: 'ok',
    version: '2.0.0',
    service: 'techtonic-heritage-room-api',
    storage: getActiveStorageMode(),
    metrics: {
      totalVisits: analytics.totalVisits,
      guestbookCount: analytics.guestbookCount,
      totalExhibitLikes: Object.values(analytics.exhibitLikes).reduce((sum, n) => sum + n, 0),
    },
    timestamp: new Date().toISOString(),
  });
}
