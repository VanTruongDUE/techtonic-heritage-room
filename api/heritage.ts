import {
  ACTIVITY_HIGHLIGHTS_SEED,
  EXECUTIVE_MEMBERS_SEED,
  EXHIBIT_ITEMS_SEED,
  TIMELINE_MILESTONES_SEED,
} from '../src/data/heritageSeed';
import type { HeritageDataPayload } from '../src/types/heritage';
import { getQueryParams, sendJson, type ApiRequest, type ApiResponse } from './_lib/http';

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  const params = getQueryParams(req);
  const term = params.get('term');
  const department = params.get('department');

  const members = EXECUTIVE_MEMBERS_SEED.filter((m) => {
    if (term && term !== 'all' && m.term !== term) return false;
    if (department && department !== 'all' && m.department !== department) return false;
    return true;
  });

  const payload: HeritageDataPayload = {
    executiveMembers: members,
    exhibitItems: EXHIBIT_ITEMS_SEED,
    timelineMilestones: TIMELINE_MILESTONES_SEED,
    activityHighlights: ACTIVITY_HIGHLIGHTS_SEED,
    stats: {
      totalMembers: EXECUTIVE_MEMBERS_SEED.length,
      totalTerms: new Set(EXECUTIVE_MEMBERS_SEED.map((m) => m.term)).size,
      totalExhibits: EXHIBIT_ITEMS_SEED.length,
    },
    updatedAt: new Date().toISOString().split('T')[0],
  };

  sendJson(res, 200, payload, 'public, s-maxage=60, stale-while-revalidate=300');
}
