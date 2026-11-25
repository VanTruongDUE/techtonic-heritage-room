import { create } from 'zustand';
import {
  ACTIVITY_HIGHLIGHTS_SEED,
  EXECUTIVE_MEMBERS_SEED,
  EXHIBIT_ITEMS_SEED,
  GUESTBOOK_ENTRIES_SEED,
  TELEPORT_ZONES,
  TIMELINE_MILESTONES_SEED,
} from '../data/heritageSeed';
import {
  ApiRequestError,
  createGuestbookEntry,
  fetchGuestbook,
  fetchHealthStatus,
  fetchHeritageData,
  fetchMuseumAnalytics,
  likeExhibitApi,
  likeGuestbookEntryApi,
  recordVisitApi,
  type HealthStatusPayload,
} from '../services/heritageApi';
import type {
  ActivityHighlight,
  ApiErrorResponse,
  ExecutiveMember,
  ExhibitItem,
  GraphicsQuality,
  GuestbookCreateInput,
  GuestbookEntry,
  GuestbookStorageMode,
  HoverPreview,
  ModalType,
  TeleportZone,
  TimelineMilestone,
  ToastItem,
} from '../types/heritage';

const QUALITY_STORAGE_KEY = 'techtonic_heritage_quality_v2';
const VOLUME_STORAGE_KEY = 'techtonic_heritage_volume_v2';
const LIKED_EXHIBITS_KEY = 'techtonic_heritage_liked_exhibits_v2';
const LIKED_GUESTBOOK_KEY = 'techtonic_heritage_liked_guestbook_v2';

export const OFFICIAL_ZONE_LABELS = TELEPORT_ZONES.map((z) => z.label);

export function countOfficialVisitedZones(visited: string[]): number {
  return OFFICIAL_ZONE_LABELS.filter((label) => visited.includes(label)).length;
}

function readStoredQuality(): GraphicsQuality {
  try {
    const val = window.localStorage.getItem(QUALITY_STORAGE_KEY);
    return val === 'balanced' ? 'balanced' : 'high';
  } catch {
    return 'high';
  }
}

function readStoredVolume(): number {
  try {
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    if (!raw) return 0.7;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.7;
  } catch {
    return 0.7;
  }
}

function readStoredStringArray(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeStoredStringArray(key: string, items: string[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(items.slice(-200)));
  } catch {
    // Ignore storage quota errors
  }
}

export interface PlayerPose {
  x: number;
  z: number;
  yaw: number;
}

interface HeritageState {
  // Entry, Controls & Pointer state
  hasEntered: boolean;
  setHasEntered: (entered: boolean) => void;
  controlMode: 'cursor' | 'fps';
  setControlMode: (mode: 'cursor' | 'fps') => void;
  isLocked: boolean;
  setLocked: (locked: boolean) => void;
  isDraggingCamera: boolean;
  setDraggingCamera: (dragging: boolean) => void;
  mouseSensitivity: number;
  setMouseSensitivity: (value: number) => void;

  // Quality, MiniMap & Guided Tour
  graphicsQuality: GraphicsQuality;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  showMiniMap: boolean;
  toggleMiniMap: () => void;
  isGuidedTourActive: boolean;
  toggleGuidedTour: () => void;
  stopGuidedTour: () => void;

  // Giant Center-Wall Cinema TV & Full-Journey Finale Prompt
  isCenterWallCinemaActive: boolean;
  isCinemaPaused: boolean;
  isCinemaMuted: boolean;
  cinemaCurrentTime: number;
  cinemaDuration: number;
  cinemaSeekRequest: number | null;
  showJourneyPrompt: boolean;
  hasTriggeredJourneyPrompt: boolean;
  startCenterWallCinema: () => void;
  stopCenterWallCinema: () => void;
  toggleCinemaPause: () => void;
  toggleCinemaMute: () => void;
  setCinemaProgress: (currentTime: number, duration: number) => void;
  requestCinemaSeek: (time: number) => void;
  clearCinemaSeek: () => void;
  openJourneyPrompt: () => void;
  dismissJourneyPrompt: () => void;

  // Spatial navigation, telemetry & smooth camera glide
  currentZone: string;
  visitedZones: string[];
  setCurrentZone: (zone: string) => void;
  playerPose: PlayerPose;
  setPlayerPose: (x: number, z: number, yaw: number) => void;
  teleportTarget: TeleportZone | null;
  requestTeleport: (zoneId: string, options?: { fromTour?: boolean }) => void;
  requestCustomGlide: (
    position: [number, number, number],
    lookAt: [number, number, number],
    label: string
  ) => void;
  clearTeleportTarget: () => void;

  // Toasts
  toasts: ToastItem[];
  pushToast: (title: string, detail?: string, tone?: ToastItem['tone']) => void;
  dismissToast: (id: string) => void;

  // Crosshair / cursor hover, rich live preview & [E] quick-interact state
  isHoveringInteractive: boolean;
  hoverTooltip: string;
  hoverPreview: HoverPreview | null;
  hoverAction: (() => void) | null;
  setHoveringInteractive: (
    hovering: boolean,
    tooltip?: string,
    action?: (() => void) | null,
    preview?: HoverPreview | null
  ) => void;
  triggerHoveredInteraction: () => void;

  // Modal system
  activeModal: ModalType;
  modalData: ExhibitItem | null;
  boardDepartmentFilter: string;
  setBoardDepartmentFilter: (dept: string) => void;
  boardTermFilter: string;
  setBoardTermFilter: (term: string) => void;
  openModal: (type: ModalType, data?: ExhibitItem | null) => void;
  openExecutiveBoard: (department?: string, term?: string) => void;
  closeModal: () => void;

  // Audio state
  isMuted: boolean;
  toggleMute: () => void;
  audioVolume: number;
  setAudioVolume: (volume: number) => void;

  // Data sets
  executiveMembers: ExecutiveMember[];
  exhibitItems: ExhibitItem[];
  timelineMilestones: TimelineMilestone[];
  activityHighlights: ActivityHighlight[];
  guestbookEntries: GuestbookEntry[];

  // Live analytics & user likes
  totalVisits: number;
  exhibitLikes: Record<string, number>;
  likedExhibitIds: string[];
  likedGuestbookIds: string[];
  apiHealth: HealthStatusPayload | null;

  // Backend sync & states
  isLoadingData: boolean;
  dataError: string | null;
  guestbookStatus: 'idle' | 'loading' | 'submitting' | 'error';
  guestbookError: string | null;
  guestbookFieldErrors: ApiErrorResponse['fieldErrors'] | null;
  storageMode: GuestbookStorageMode;
  loadHeritageData: () => Promise<void>;
  loadGuestbook: () => Promise<void>;
  loadAnalytics: () => Promise<void>;
  loadHealthStatus: () => Promise<void>;
  recordVisit: () => Promise<void>;
  likeExhibit: (exhibitId: string) => Promise<boolean>;
  likeGuestbook: (entryId: string) => Promise<boolean>;
  submitGuestbookEntry: (entry: GuestbookCreateInput) => Promise<boolean>;
  clearGuestbookErrors: () => void;
}

let toastCounter = 0;
let journeyPromptTimer: number | null = null;

function maybeScheduleJourneyPrompt(get: () => HeritageState, set: (partial: Partial<HeritageState>) => void, nextVisited: string[]) {
  const state = get();
  if (state.hasTriggeredJourneyPrompt || state.isCenterWallCinemaActive || !state.hasEntered) {
    return;
  }
  const completedAll = countOfficialVisitedZones(nextVisited) >= OFFICIAL_ZONE_LABELS.length;
  if (!completedAll) return;

  set({ hasTriggeredJourneyPrompt: true });
  if (journeyPromptTimer !== null) {
    window.clearTimeout(journeyPromptTimer);
  }
  journeyPromptTimer = window.setTimeout(() => {
    const curr = get();
    if (!curr.isCenterWallCinemaActive && !curr.activeModal) {
      set({ showJourneyPrompt: true, isGuidedTourActive: false });
    } else if (!curr.isCenterWallCinemaActive) {
      // If user has another modal open right when finishing 8/8, show immediately after
      set({ showJourneyPrompt: true, activeModal: null, modalData: null, isGuidedTourActive: false });
    }
  }, 950);
}

export const useHeritageStore = create<HeritageState>((set, get) => ({
  hasEntered: false,
  setHasEntered: (entered) => set({ hasEntered: entered }),
  controlMode: 'cursor',
  setControlMode: (mode) => {
    if (mode === 'cursor' && document.pointerLockElement && document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch {
        // Ignore if already unlocked
      }
    }
    set({ controlMode: mode, isLocked: false });
  },
  isLocked: false,
  setLocked: (locked) => set({ isLocked: locked }),
  isDraggingCamera: false,
  setDraggingCamera: (dragging) => set({ isDraggingCamera: dragging }),

  mouseSensitivity: 1.0,
  setMouseSensitivity: (value) =>
    set({ mouseSensitivity: Math.min(1.8, Math.max(0.4, Number(value.toFixed(2)))) }),

  graphicsQuality: readStoredQuality(),
  setGraphicsQuality: (quality) => {
    try {
      window.localStorage.setItem(QUALITY_STORAGE_KEY, quality);
    } catch {
      // Ignore
    }
    set({ graphicsQuality: quality });
    get().pushToast(
      quality === 'high' ? 'Đồ họa: Chất lượng cao' : 'Đồ họa: Mượt mà tối ưu',
      quality === 'high'
        ? 'Phản chiếu sàn độ phân giải cao và khử răng cưa sắc nét.'
        : 'Tối ưu khung hình ổn định cho máy cấu hình trung bình.',
      'info'
    );
  },

  showMiniMap: true,
  toggleMiniMap: () => set((state) => ({ showMiniMap: !state.showMiniMap })),

  isGuidedTourActive: false,
  toggleGuidedTour: () => {
    const next = !get().isGuidedTourActive;
    set({
      isGuidedTourActive: next,
      isCenterWallCinemaActive: next ? false : get().isCenterWallCinemaActive,
      activeModal: null,
      modalData: null,
    });
    get().pushToast(
      next ? 'Bắt đầu tham quan tự động' : 'Đã tạm dừng tham quan tự động',
      next
        ? 'Camera sẽ lướt mượt qua từng phân khu. Nhấn WASD hoặc kéo chuột để tự điều khiển.'
        : 'Bạn có thể tự do di chuyển và khám phá.',
      next ? 'accent' : 'info'
    );
  },
  stopGuidedTour: () => {
    if (get().isGuidedTourActive) {
      set({ isGuidedTourActive: false });
    }
  },

  // Giant 3D Cinema TV state
  isCenterWallCinemaActive: false,
  isCinemaPaused: false,
  isCinemaMuted: false,
  cinemaCurrentTime: 0,
  cinemaDuration: 0,
  cinemaSeekRequest: null,
  showJourneyPrompt: false,
  hasTriggeredJourneyPrompt: false,

  startCenterWallCinema: () => {
    if (document.pointerLockElement && document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch {
        // Ignore
      }
    }
    const cinemaSeat: TeleportZone = {
      id: 'cinema-front-row',
      label: 'Vách Tâm Điểm',
      shortLabel: 'Cinema TV',
      description: 'Màn hình TV khổng lồ chiếu thước phim hành trình TechTonic Club.',
      position: [0, 1.55, -10.1],
      lookAt: [0, 3.35, -18.4],
    };
    set((state) => ({
      isCenterWallCinemaActive: true,
      isCinemaPaused: false,
      showJourneyPrompt: false,
      activeModal: null,
      modalData: null,
      isGuidedTourActive: false,
      isLocked: false,
      teleportTarget: cinemaSeat,
      currentZone: 'Vách Tâm Điểm',
      visitedZones: state.visitedZones.includes('Vách Tâm Điểm')
        ? state.visitedZones
        : [...state.visitedZones, 'Vách Tâm Điểm'],
    }));
    get().pushToast(
      'Chế độ Rạp Chiếu 3D TechTonic',
      'Bảng Dream it - Code it đã chuyển thành màn hình TV khổng lồ. Nhấn ESC để quay lại.',
      'accent'
    );
  },

  stopCenterWallCinema: () => {
    set({
      isCenterWallCinemaActive: false,
      isCinemaPaused: false,
      cinemaCurrentTime: 0,
      cinemaSeekRequest: null,
    });
  },

  toggleCinemaPause: () => set((state) => ({ isCinemaPaused: !state.isCinemaPaused })),
  toggleCinemaMute: () => set((state) => ({ isCinemaMuted: !state.isCinemaMuted })),
  setCinemaProgress: (currentTime, duration) =>
    set({ cinemaCurrentTime: currentTime, cinemaDuration: duration }),
  requestCinemaSeek: (time) => set({ cinemaSeekRequest: time }),
  clearCinemaSeek: () => set({ cinemaSeekRequest: null }),
  openJourneyPrompt: () => set({ showJourneyPrompt: true, activeModal: null, modalData: null }),
  dismissJourneyPrompt: () => set({ showJourneyPrompt: false }),

  currentZone: 'Hành Lang Lối Vào',
  visitedZones: ['Hành Lang Lối Vào'],
  setCurrentZone: (zone) => {
    const state = get();
    if (state.currentZone === zone) return;
    const isOfficial = OFFICIAL_ZONE_LABELS.includes(zone);
    const isNewOfficial = isOfficial && !state.visitedZones.includes(zone);
    const nextVisited = isNewOfficial ? [...state.visitedZones, zone] : state.visitedZones;
    set({ currentZone: zone, visitedZones: nextVisited });

    if (isNewOfficial && state.hasEntered) {
      const count = countOfficialVisitedZones(nextVisited);
      get().pushToast(
        `Khám phá khu vực mới: ${zone}`,
        `Tiến độ tham quan ${count}/${OFFICIAL_ZONE_LABELS.length} phân khu chính`,
        count >= OFFICIAL_ZONE_LABELS.length ? 'success' : 'accent'
      );
      maybeScheduleJourneyPrompt(get, set, nextVisited);
    }
  },

  playerPose: { x: 0, z: 25.8, yaw: 0 },
  setPlayerPose: (x, z, yaw) =>
    set((state) => {
      if (
        Math.abs(state.playerPose.x - x) < 0.04 &&
        Math.abs(state.playerPose.z - z) < 0.04 &&
        Math.abs(state.playerPose.yaw - yaw) < 0.025
      ) {
        return state;
      }
      return { playerPose: { x, z, yaw } };
    }),

  teleportTarget: null,
  requestTeleport: (zoneId, options) => {
    const target = TELEPORT_ZONES.find((z) => z.id === zoneId);
    if (!target) return;
    const state = get();
    const isNew = !state.visitedZones.includes(target.label);
    const nextVisited = isNew ? [...state.visitedZones, target.label] : state.visitedZones;

    set({
      teleportTarget: target,
      currentZone: target.label,
      visitedZones: nextVisited,
      isGuidedTourActive: options?.fromTour ? state.isGuidedTourActive : false,
      activeModal: null,
      modalData: null,
    });

    if (isNew && state.hasEntered) {
      maybeScheduleJourneyPrompt(get, set, nextVisited);
    }
  },
  requestCustomGlide: (position, lookAt, label) => {
    const customTarget: TeleportZone = {
      id: `custom-${Date.now()}`,
      label,
      shortLabel: label,
      description: label,
      position,
      lookAt,
    };
    set({
      teleportTarget: customTarget,
      currentZone: label,
      isGuidedTourActive: false,
      activeModal: null,
      modalData: null,
    });
  },
  clearTeleportTarget: () => set({ teleportTarget: null }),

  toasts: [],
  pushToast: (title, detail, tone = 'info') => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { id, title, detail, tone }],
    }));
    window.setTimeout(() => {
      get().dismissToast(id);
    }, 3400);
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  isHoveringInteractive: false,
  hoverTooltip: '',
  hoverPreview: null,
  hoverAction: null,
  setHoveringInteractive: (hovering, tooltip = '', action = null, preview = null) =>
    set({
      isHoveringInteractive: hovering,
      hoverTooltip: hovering ? tooltip : '',
      hoverAction: hovering ? action : null,
      hoverPreview: hovering ? preview : null,
    }),
  triggerHoveredInteraction: () => {
    const action = get().hoverAction;
    if (action) {
      action();
    }
  },

  activeModal: null,
  modalData: null,
  boardDepartmentFilter: 'ALL',
  setBoardDepartmentFilter: (dept) => set({ boardDepartmentFilter: dept }),
  boardTermFilter: 'Nhiệm kỳ 2026 - 2027',
  setBoardTermFilter: (term) => set({ boardTermFilter: term }),
  openModal: (type, data = null) => {
    if (document.pointerLockElement && document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch (e) {
        console.warn('exitPointerLock error:', e);
      }
    }
    set({
      activeModal: type,
      modalData: data,
      showJourneyPrompt: false,
      isGuidedTourActive: false,
      isLocked: false,
      isDraggingCamera: false,
      isHoveringInteractive: false,
      hoverTooltip: '',
      hoverPreview: null,
      hoverAction: null,
    });
  },
  openExecutiveBoard: (department = 'ALL', term = 'Nhiệm kỳ 2026 - 2027') => {
    if (document.pointerLockElement && document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch {
        // Ignore
      }
    }
    set({
      activeModal: 'shirt',
      modalData: null,
      showJourneyPrompt: false,
      boardDepartmentFilter: department,
      boardTermFilter: term,
      isGuidedTourActive: false,
      isLocked: false,
      isDraggingCamera: false,
      isHoveringInteractive: false,
      hoverTooltip: '',
      hoverPreview: null,
      hoverAction: null,
    });
  },
  closeModal: () => {
    set({ activeModal: null, modalData: null });
  },

  isMuted: false,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  audioVolume: readStoredVolume(),
  setAudioVolume: (volume) => {
    const clamped = Math.min(1, Math.max(0, Number(volume.toFixed(2))));
    try {
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
    } catch {
      // Ignore
    }
    set({ audioVolume: clamped, isMuted: clamped === 0 });
  },

  executiveMembers: EXECUTIVE_MEMBERS_SEED,
  exhibitItems: EXHIBIT_ITEMS_SEED,
  timelineMilestones: TIMELINE_MILESTONES_SEED,
  activityHighlights: ACTIVITY_HIGHLIGHTS_SEED,
  guestbookEntries: GUESTBOOK_ENTRIES_SEED,

  totalVisits: 128,
  exhibitLikes: {
    'mission-vision': 42,
    'club-shirt-3d': 35,
    'trophy-sv-it': 29,
  },
  likedExhibitIds: readStoredStringArray(LIKED_EXHIBITS_KEY),
  likedGuestbookIds: readStoredStringArray(LIKED_GUESTBOOK_KEY),
  apiHealth: null,

  isLoadingData: false,
  dataError: null,
  guestbookStatus: 'idle',
  guestbookError: null,
  guestbookFieldErrors: null,
  storageMode: 'local',

  loadHeritageData: async () => {
    set({ isLoadingData: true, dataError: null });
    try {
      const payload = await fetchHeritageData();
      set({
        executiveMembers: payload.executiveMembers,
        exhibitItems: payload.exhibitItems,
        timelineMilestones: payload.timelineMilestones,
        activityHighlights: payload.activityHighlights,
        isLoadingData: false,
      });
    } catch {
      set({ isLoadingData: false });
    }
  },

  loadGuestbook: async () => {
    set({ guestbookStatus: 'loading', guestbookError: null });
    try {
      const res = await fetchGuestbook();
      set({
        guestbookEntries: res.entries,
        storageMode: res.storage,
        guestbookStatus: 'idle',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải sổ lưu bút.';
      set({ guestbookStatus: 'error', guestbookError: msg });
    }
  },

  loadAnalytics: async () => {
    const payload = await fetchMuseumAnalytics();
    set({
      totalVisits: payload.totalVisits,
      exhibitLikes: payload.exhibitLikes,
      storageMode: payload.storage,
    });
  },

  loadHealthStatus: async () => {
    const health = await fetchHealthStatus();
    if (health) {
      set({ apiHealth: health });
    }
  },

  recordVisit: async () => {
    const payload = await recordVisitApi();
    set({
      totalVisits: payload.totalVisits,
      exhibitLikes: payload.exhibitLikes,
      storageMode: payload.storage,
    });
  },

  likeExhibit: async (exhibitId) => {
    const state = get();
    if (state.likedExhibitIds.includes(exhibitId)) {
      return false;
    }

    const nextLiked = [...state.likedExhibitIds, exhibitId];
    writeStoredStringArray(LIKED_EXHIBITS_KEY, nextLiked);
    set({
      likedExhibitIds: nextLiked,
      exhibitLikes: {
        ...state.exhibitLikes,
        [exhibitId]: (state.exhibitLikes[exhibitId] ?? 0) + 1,
      },
    });

    const payload = await likeExhibitApi(exhibitId);
    set({
      totalVisits: payload.totalVisits,
      exhibitLikes: payload.exhibitLikes,
      storageMode: payload.storage,
    });
    return true;
  },

  likeGuestbook: async (entryId) => {
    const state = get();
    if (state.likedGuestbookIds.includes(entryId)) {
      return false;
    }

    const nextLiked = [...state.likedGuestbookIds, entryId];
    writeStoredStringArray(LIKED_GUESTBOOK_KEY, nextLiked);
    set({
      likedGuestbookIds: nextLiked,
      guestbookEntries: state.guestbookEntries.map((entry) =>
        entry.id === entryId ? { ...entry, likes: (entry.likes ?? 0) + 1 } : entry
      ),
    });

    const res = await likeGuestbookEntryApi(entryId);
    if (res) {
      set((curr) => ({
        guestbookEntries: curr.guestbookEntries.map((entry) =>
          entry.id === res.entry.id ? res.entry : entry
        ),
        storageMode: res.storage,
      }));
    }
    return true;
  },

  submitGuestbookEntry: async (input) => {
    set({
      guestbookStatus: 'submitting',
      guestbookError: null,
      guestbookFieldErrors: null,
    });

    try {
      const res = await createGuestbookEntry(input);
      set((state) => ({
        guestbookEntries: [
          res.entry,
          ...state.guestbookEntries.filter((e) => e.id !== res.entry.id),
        ],
        storageMode: res.storage,
        guestbookStatus: 'idle',
      }));
      get().pushToast('Đã lưu lời chúc vào Sổ Lưu Bút', `Cảm ơn ${res.entry.author}!`, 'success');
      return true;
    } catch (err) {
      if (err instanceof ApiRequestError) {
        set({
          guestbookStatus: 'error',
          guestbookError: err.message,
          guestbookFieldErrors: err.fieldErrors ?? null,
        });
      } else {
        set({
          guestbookStatus: 'error',
          guestbookError: 'Không thể gửi lời chúc. Vui lòng thử lại.',
        });
      }
      return false;
    }
  },

  clearGuestbookErrors: () => set({ guestbookError: null, guestbookFieldErrors: null }),
}));
