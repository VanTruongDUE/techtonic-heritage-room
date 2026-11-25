import React, { useEffect } from 'react';
import { CanvasContainer } from './components/3d/CanvasContainer';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { HUD } from './components/ui/HUD';
import { Crosshair } from './components/ui/Crosshair';
import { ToastStack } from './components/ui/ToastStack';
import { CinemaControlsBar } from './components/ui/CinemaControlsBar';
import { MusicPlayer } from './components/ui/MusicPlayer';
import { ExecutiveBoardModal } from './components/ui/Modals/ExecutiveBoardModal';
import { GuestbookModal } from './components/ui/Modals/GuestbookModal';
import { ExhibitDetailModal } from './components/ui/Modals/ExhibitDetailModal';
import { InstructionsModal } from './components/ui/Modals/InstructionsModal';
import { JourneyPromptModal } from './components/ui/Modals/JourneyPromptModal';
import { TELEPORT_ZONES } from './data/heritageSeed';
import { useHeritageStore } from './store/useHeritageStore';
import { useAudio } from './hooks/useAudio';
import { emitPlayerEvent } from './utils/playerEvents';
import { PLAYER_EVENTS } from './types/playerEvents';

export const App: React.FC = () => {
  const {
    hasEntered,
    activeModal,
    openModal,
    closeModal,
    setHasEntered,
    loadHeritageData,
    loadGuestbook,
    loadAnalytics,
    loadHealthStatus,
    recordVisit,
    requestTeleport,
    toggleMiniMap,
    toggleGuidedTour,
    stopGuidedTour,
    isGuidedTourActive,
    showJourneyPrompt,
    dismissJourneyPrompt,
    isCenterWallCinemaActive,
    stopCenterWallCinema,
  } = useHeritageStore();
  const { initAudio, playChime, playSuccessChord } = useAudio();

  // Fetch initial heritage, guestbook, analytics & API health (deduplicated + local fallback)
  useEffect(() => {
    void loadHeritageData();
    void loadGuestbook();
    void loadAnalytics();
    void loadHealthStatus();
  }, [loadHeritageData, loadGuestbook, loadAnalytics, loadHealthStatus]);

  // Play subtle chime when opening an exhibit/board/guestbook modal
  useEffect(() => {
    if (activeModal) {
      playChime(activeModal === 'guestbook' ? 740 : 620);
    }
  }, [activeModal, playChime]);

  // Handle Enter Experience from LoadingScreen (starts TechTonic playlist + SFX cleanly)
  const handleEnter = () => {
    initAudio();
    playSuccessChord();
    emitPlayerEvent(PLAYER_EVENTS.PLAY);
    setHasEntered(true);
    void recordVisit();
  };

  // Blur HUD buttons immediately after pointer click so Spacebar never re-triggers them while exploring 3D
  useEffect(() => {
    const handlePointerClick = (e: MouseEvent) => {
      if (useHeritageStore.getState().activeModal) return;
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest('button, a');
      if (btn instanceof HTMLElement && !btn.closest('[role="dialog"]')) {
        window.setTimeout(() => {
          if (document.activeElement === btn) {
            btn.blur();
          }
        }, 0);
      }
    };
    window.addEventListener('click', handlePointerClick);
    return () => window.removeEventListener('click', handlePointerClick);
  }, []);

  // Global keyboard shortcuts: ESC, H, M, T, and 1–8 zone glides
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showJourneyPrompt) {
          dismissJourneyPrompt();
          return;
        }
        if (activeModal) {
          closeModal();
          return;
        }
        if (isCenterWallCinemaActive) {
          stopCenterWallCinema();
          return;
        }
        if (isGuidedTourActive) {
          stopGuidedTour();
          return;
        }
      }

      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      if (e.code === 'KeyH') {
        if (activeModal === 'instructions') {
          closeModal();
        } else if (!activeModal) {
          openModal('instructions');
        }
        return;
      }

      if (!hasEntered || activeModal) return;

      if (e.code === 'KeyM') {
        toggleMiniMap();
        return;
      }

      if (e.code === 'KeyT') {
        toggleGuidedTour();
        return;
      }

      // Digits 1–8 smoothly glide to teleport zones
      if (e.code.startsWith('Digit')) {
        const digit = Number(e.code.replace('Digit', ''));
        if (digit >= 1 && digit <= TELEPORT_ZONES.length) {
          requestTeleport(TELEPORT_ZONES[digit - 1].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    hasEntered,
    activeModal,
    showJourneyPrompt,
    isCenterWallCinemaActive,
    isGuidedTourActive,
    openModal,
    closeModal,
    dismissJourneyPrompt,
    stopCenterWallCinema,
    toggleMiniMap,
    toggleGuidedTour,
    stopGuidedTour,
    requestTeleport,
  ]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#05070a] select-none">
      {/* 1. 3D Canvas Layer */}
      <CanvasContainer />

      {/* 2. 2D Interactive HUD Layer (including MiniMap) */}
      <HUD />

      {/* 3. Giant 3D Cinema TV Floating Remote Bar */}
      <CinemaControlsBar />

      {/* 3b. Floating TechTonic Background Music Player (always mounted to preserve playback) */}
      <MusicPlayer show={hasEntered && !isCenterWallCinemaActive && !showJourneyPrompt} />

      {/* 4. Subtle Toast Notifications */}
      <ToastStack />

      {/* 5. Cursor Halo / Center Crosshair targeting reticle */}
      <Crosshair />

      {/* 6. Interactive Modals outside Canvas */}
      <ExecutiveBoardModal />
      <GuestbookModal />
      <ExhibitDetailModal />
      <InstructionsModal />
      <JourneyPromptModal />

      {/* 7. Mandatory Loading Screen with Progress and Entry Button */}
      <LoadingScreen onEnter={handleEnter} />
    </main>
  );
};

export default App;
