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
  fetchHeritageData,
} from '../services/heritageApi';
import type {
  ActivityHighlight,
  ApiErrorResponse,
  ExecutiveMember,
  ExhibitItem,
  GuestbookCreateInput,
  GuestbookEntry,
  GuestbookStorageMode,
  ModalType,
  TeleportZone,
  TimelineMilestone,
} from '../types/heritage';

interface HeritageState {
  // Controls & Pointer state
  isLocked: boolean;
  setLocked: (locked: boolean) => void;
  mouseSensitivity: number;
  setMouseSensitivity: (value: number) => void;

  // Spatial navigation & teleportation
  currentZone: string;
  setCurrentZone: (zone: string) => void;
  teleportTarget: TeleportZone | null;
  requestTeleport: (zoneId: string) => void;
  clearTeleportTarget: () => void;

  // Crosshair hover & [E] quick-interact state
  isHoveringInteractive: boolean;
  hoverTooltip: string;
  hoverAction: (() => void) | null;
  setHoveringInteractive: (hovering: boolean, tooltip?: string, action?: (() => void) | null) => void;
  triggerHoveredInteraction: () => void;

  // Modal system
  activeModal: ModalType;
  modalData: ExhibitItem | null;
  openModal: (type: ModalType, data?: ExhibitItem | null) => void;
  closeModal: () => void;

  // Audio state
  isMuted: boolean;
  toggleMute: () => void;

  // Data sets
  executiveMembers: ExecutiveMember[];
  exhibitItems: ExhibitItem[];
  timelineMilestones: TimelineMilestone[];
  activityHighlights: ActivityHighlight[];
  guestbookEntries: GuestbookEntry[];

  // Backend sync & states
  isLoadingData: boolean;
  dataError: string | null;
  guestbookStatus: 'idle' | 'loading' | 'submitting' | 'error';
  guestbookError: string | null;
  guestbookFieldErrors: ApiErrorResponse['fieldErrors'] | null;
  storageMode: GuestbookStorageMode;
  loadHeritageData: () => Promise<void>;
  loadGuestbook: () => Promise<void>;
  submitGuestbookEntry: (entry: GuestbookCreateInput) => Promise<boolean>;
  clearGuestbookErrors: () => void;
}

export const useHeritageStore = create<HeritageState>((set, get) => ({
  isLocked: false,
  setLocked: (locked) => set({ isLocked: locked }),

  mouseSensitivity: 1.0,
  setMouseSensitivity: (value) =>
    set({ mouseSensitivity: Math.min(1.8, Math.max(0.4, Number(value.toFixed(2)))) }),

  currentZone: 'Hành Lang Lối Vào',
  setCurrentZone: (zone) =>
    set((state) => (state.currentZone === zone ? state : { currentZone: zone })),

  teleportTarget: null,
  requestTeleport: (zoneId) => {
    const target = TELEPORT_ZONES.find((z) => z.id === zoneId);
    if (!target) return;
    set({
      teleportTarget: target,
      currentZone: target.label,
      activeModal: null,
      modalData: null,
    });
  },
  clearTeleportTarget: () => set({ teleportTarget: null }),

  isHoveringInteractive: false,
  hoverTooltip: '',
  hoverAction: null,
  setHoveringInteractive: (hovering, tooltip = '', action = null) =>
    set({
      isHoveringInteractive: hovering,
      hoverTooltip: hovering ? tooltip : '',
      hoverAction: hovering ? action : null,
    }),
  triggerHoveredInteraction: () => {
    const action = get().hoverAction;
    if (action) {
      action();
    }
  },

  activeModal: null,
  modalData: null,
  openModal: (type, data = null) => {
    if (document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch (e) {
        console.warn('exitPointerLock error:', e);
      }
    }
    set({
      activeModal: type,
      modalData: data,
      isLocked: false,
      isHoveringInteractive: false,
      hoverTooltip: '',
      hoverAction: null,
    });
  },
  closeModal: () => {
    set({ activeModal: null, modalData: null });
  },

  isMuted: false,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  executiveMembers: EXECUTIVE_MEMBERS_SEED,
  exhibitItems: EXHIBIT_ITEMS_SEED,
  timelineMilestones: TIMELINE_MILESTONES_SEED,
  activityHighlights: ACTIVITY_HIGHLIGHTS_SEED,
  guestbookEntries: GUESTBOOK_ENTRIES_SEED,

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
      // Keep bundled seed data silently when offline or in static preview
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
