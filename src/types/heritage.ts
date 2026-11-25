export type Department =
  | 'Ban Chủ Nhiệm'
  | 'Ban Chuyên Môn'
  | 'Ban Sự Kiện'
  | 'Ban Nhân Sự'
  | 'Ban Truyền Thông';

export interface ExecutiveMember {
  id: string;
  name: string;
  role: string;
  term: string; // e.g. "Nhiệm kỳ 2024 - 2025", "Nhiệm kỳ 2025 - 2026", "Nhiệm kỳ 2026 - 2027"
  avatar?: string;
  avatarPosition?: string;
  bio?: string;
  department: Department;
  isFounder?: boolean;
}

export type ExhibitCategory = 'trophy' | 'certificate' | 'activity' | 'history';

export interface ExhibitItem {
  id: string;
  title: string;
  category: ExhibitCategory;
  year: string;
  description: string;
  image?: string;
  highlight?: string;
  bullets?: string[];
  metrics?: Array<{ label: string; value: string }>;
  links?: Array<{ label: string; url: string }>;
}

export interface HoverPreview {
  title: string;
  badge?: string;
  summary: string;
  bullets?: string[];
  metrics?: Array<{ label: string; value: string }>;
  actionLabel?: string;
}

export interface TimelineMilestone {
  id: string;
  year: string;
  title: string;
  description: string;
  highlights: string[];
}

export interface ActivityHighlight {
  id: string;
  title: string;
  tag: string;
  year: string;
  color: string;
  summary: string;
  goal?: string;
  audience?: string;
}

export type GuestbookTag = 'Lời chúc' | 'Kỷ niệm' | 'Cựu thành viên' | 'Góp ý';

export interface GuestbookEntry {
  id: string;
  author: string;
  roleOrAffiliation: string;
  message: string;
  timestamp: string;
  tag?: GuestbookTag;
  likes?: number;
}

export type GuestbookStorageMode = 'kv' | 'file' | 'memory' | 'local';

export interface HeritageDataPayload {
  executiveMembers: ExecutiveMember[];
  exhibitItems: ExhibitItem[];
  timelineMilestones: TimelineMilestone[];
  activityHighlights: ActivityHighlight[];
  stats?: {
    totalMembers: number;
    totalTerms: number;
    totalExhibits: number;
  };
  updatedAt: string;
}

export interface GuestbookListResponse {
  entries: GuestbookEntry[];
  total?: number;
  storage: GuestbookStorageMode;
}

export interface GuestbookCreateInput {
  author: string;
  roleOrAffiliation: string;
  message: string;
  tag?: GuestbookTag;
}

export interface GuestbookCreateResponse {
  entry: GuestbookEntry;
  storage: GuestbookStorageMode;
}

export interface GuestbookLikeResponse {
  entry: GuestbookEntry;
  storage: GuestbookStorageMode;
}

export interface MuseumAnalyticsPayload {
  totalVisits: number;
  exhibitLikes: Record<string, number>;
  guestbookCount: number;
  storage: GuestbookStorageMode;
  updatedAt: string;
}

export interface ApiErrorResponse {
  error: string;
  fieldErrors?: Partial<Record<'author' | 'roleOrAffiliation' | 'message', string>>;
}

export interface MemberTestimonial {
  id: string;
  name: string;
  role: string;
  tag: string;
  quote: string;
  avatar: string;
  accent: string;
}

export type ModalType = 'shirt' | 'guestbook' | 'exhibit' | 'instructions' | 'testimonials' | null;

export type GraphicsQuality = 'high' | 'balanced';

export interface ToastItem {
  id: string;
  title: string;
  detail?: string;
  tone?: 'info' | 'success' | 'accent';
}

export interface TeleportZone {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  position: [number, number, number];
  lookAt: [number, number, number];
}
