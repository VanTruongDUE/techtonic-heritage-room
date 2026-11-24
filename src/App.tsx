import React, { useEffect } from 'react';
import { CanvasContainer } from './components/3d/CanvasContainer';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { HUD } from './components/ui/HUD';
import { Crosshair } from './components/ui/Crosshair';
import { ExecutiveBoardModal } from './components/ui/Modals/ExecutiveBoardModal';
import { GuestbookModal } from './components/ui/Modals/GuestbookModal';
import { ExhibitDetailModal } from './components/ui/Modals/ExhibitDetailModal';
import { InstructionsModal } from './components/ui/Modals/InstructionsModal';
import { useHeritageStore } from './store/useHeritageStore';
import { useAudio } from './hooks/useAudio';

export const App: React.FC = () => {
  const { activeModal, openModal, closeModal, setLocked, loadHeritageData, loadGuestbook } =
    useHeritageStore();
  const { initAudio, playChime } = useAudio();

  // Fetch initial heritage & guestbook data from BE API (with resilient local fallback)
  useEffect(() => {
    void loadHeritageData();
    void loadGuestbook();
  }, [loadHeritageData, loadGuestbook]);

  // Play subtle chime when opening an exhibit/board/guestbook modal
  useEffect(() => {
    if (activeModal) {
      playChime(activeModal === 'guestbook' ? 740 : 620);
    }
  }, [activeModal, playChime]);

  // Handle Enter Experience from LoadingScreen
  const handleEnter = () => {
    initAudio();
    playChime(523.25);
    const canvas = document.querySelector('canvas');
    if (canvas) {
      Promise.resolve(canvas.requestPointerLock?.()).catch(() => {});
    }
    setLocked(true);
  };

  // Global ESC & [H] keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal) {
        closeModal();
        return;
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, openModal, closeModal]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#05070a] select-none">
      {/* 1. 3D Canvas Layer */}
      <CanvasContainer />

      {/* 2. 2D Interactive HUD Layer */}
      <HUD />

      {/* 3. Center Crosshair targeting reticle */}
      <Crosshair />

      {/* 4. Interactive Modals outside Canvas */}
      <ExecutiveBoardModal />
      <GuestbookModal />
      <ExhibitDetailModal />
      <InstructionsModal />

      {/* 5. Mandatory Loading Screen with Progress and Entry Button */}
      <LoadingScreen onEnter={handleEnter} />
    </main>
  );
};

export default App;
