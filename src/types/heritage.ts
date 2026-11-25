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

export interface GuestbookEntry {
  id: string;
  author: string;
  roleOrAffiliation: string;
  message: string;
  timestamp: string;
}

export type GuestbookStorageMode = 'kv' | 'file' | 'memory' | 'local';

export interface HeritageDataPayload {
  executiveMembers: ExecutiveMember[];
  exhibitItems: ExhibitItem[];
  timelineMilestones: TimelineMilestone[];
  activityHighlights: ActivityHighlight[];
  updatedAt: string;
}

export interface GuestbookListResponse {
  entries: GuestbookEntry[];
  storage: GuestbookStorageMode;
}

export interface GuestbookCreateInput {
  author: string;
  roleOrAffiliation: string;
  message: string;
}

export interface GuestbookCreateResponse {
  entry: GuestbookEntry;
  storage: GuestbookStorageMode;
}

export interface ApiErrorResponse {
  error: string;
  fieldErrors?: Partial<Record<'author' | 'roleOrAffiliation' | 'message', string>>;
}

export type ModalType = 'shirt' | 'guestbook' | 'exhibit' | 'instructions' | null;

export interface TeleportZone {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  position: [number, number, number];
  lookAt: [number, number, number];
}
