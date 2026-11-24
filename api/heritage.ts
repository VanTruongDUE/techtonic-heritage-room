import {
  ACTIVITY_HIGHLIGHTS_SEED,
  EXECUTIVE_MEMBERS_SEED,
  EXHIBIT_ITEMS_SEED,
  TIMELINE_MILESTONES_SEED,
} from '../src/data/heritageSeed';
import type { HeritageDataPayload } from '../src/types/heritage';
import { sendJson, type ApiRequest, type ApiResponse } from './_lib/http';

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  const payload: HeritageDataPayload = {
    executiveMembers: EXECUTIVE_MEMBERS_SEED,
    exhibitItems: EXHIBIT_ITEMS_SEED,
    timelineMilestones: TIMELINE_MILESTONES_SEED,
    activityHighlights: ACTIVITY_HIGHLIGHTS_SEED,
    updatedAt: '2026-11-25',
  };

  sendJson(res, 200, payload, 'public, s-maxage=60, stale-while-revalidate=300');
}
