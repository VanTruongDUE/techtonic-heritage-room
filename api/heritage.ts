import {
  ACTIVITY_HIGHLIGHTS_SEED,
  CLUB_PROFILE,
  EXECUTIVE_MEMBERS_SEED,
  EXHIBIT_ITEMS_SEED,
  TIMELINE_MILESTONES_SEED,
} from '../src/data/heritageSeed.js';
import type { HeritageDataPayload } from '../src/types/heritage.js';
import { getQueryParams, handlePreflight, sendJson, type ApiRequest, type ApiResponse } from './_lib/http.js';

const DIGITAL_ECOSYSTEM_PORTALS = [
  {
    id: 'vitrine-website-techtonic',
    title: 'Cổng Thông Tin TechTonic Club',
    badge: 'WEBSITE CHÍNH THỨC',
    url: 'https://www.techtonic-club.id.vn',
  },
  {
    id: 'vitrine-facebook-techtonic',
    title: 'Fanpage & Cộng Đồng TechTonic',
    badge: 'CỘNG ĐỒNG FACEBOOK',
    url: 'https://www.facebook.com/TechTonic.Club17',
  },
  {
    id: 'vitrine-drive-archive',
    title: 'Thư Viện Tài Liệu Google Drive',
    badge: 'KHO TÀI LIỆU HỌC THUẬT',
    url: 'https://drive.google.com/drive/folders/13ts2b1hP9-AUOuKNxFhrkZqW5-2zHO8m',
  },
  {
    id: 'vitrine-minigame-puzzle',
    title: 'Minigame Live Puzzle TechTonic',
    badge: 'MINIGAME TƯƠNG TÁC',
    url: 'https://van-truong-due-mini-game-live-puzzl.vercel.app/',
  },
];

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (handlePreflight(req, res, 'GET, OPTIONS')) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
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
    testimonials: CLUB_PROFILE.testimonials,
    digitalEcosystem: DIGITAL_ECOSYSTEM_PORTALS,
    stats: {
      totalMembers: EXECUTIVE_MEMBERS_SEED.length,
      totalTerms: new Set(EXECUTIVE_MEMBERS_SEED.map((m) => m.term)).size,
      totalExhibits: EXHIBIT_ITEMS_SEED.length + 37,
      totalDepartments: 5,
      totalPhotoPedestals: 37,
      totalDigitalVitrines: DIGITAL_ECOSYSTEM_PORTALS.length,
    },
    updatedAt: new Date().toISOString().split('T')[0],
  };

  sendJson(res, 200, payload, 'public, s-maxage=60, stale-while-revalidate=300');
}
