export type Department =
  | 'Ban Chủ Nhiệm'
  | 'Ban Chuyên Môn'
  | 'Ban Truyền Thông'
  | 'Ban Đối Ngoại'
  | 'Ban Sự Kiện';

export interface ExecutiveMember {
  id: string;
  name: string;
  role: string;
  term: string; // e.g. "Nhiệm kỳ 2023 - 2024", "Nhiệm kỳ 2024 - 2025"
  avatar?: string;
  bio?: string;
  department: Department;
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
